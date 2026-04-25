import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import { deleteImage, isCloudinaryConfigured } from '../utils/cloudinary.js';

// @desc    Fetch all products (with search, filter, pagination)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 12;
    const page = Number(req.query.pageNumber) || 1;

    // Build filter object
    const filter = {};

    // Build filter array for components that require $or
    const andFilters = [];

    // Keyword search (name, description, or specs)
    if (req.query.keyword) {
        andFilters.push({
            $or: [
                { name: { $regex: req.query.keyword, $options: 'i' } },
                { description: { $regex: req.query.keyword, $options: 'i' } },
                { specifications: { $regex: req.query.keyword, $options: 'i' } }
            ]
        });
    }

    // Category filter
    if (req.query.category) {
        filter.partCategory = req.query.category;
    }

    // Broad category filter (Gaming PC vs PC parts)
    if (req.query.broadCategory) {
        if (req.query.broadCategory === 'Gaming PC') {
            andFilters.push({ $or: [{ category: 'Gaming PC' }, { category: 'PC' }, { partCategory: 'pc' }] });
        } else if (req.query.broadCategory === 'PC parts') {
            andFilters.push({ $nor: [{ category: 'Gaming PC' }, { category: 'PC' }, { partCategory: 'pc' }] });
        }
    }

    if (andFilters.length > 0) {
        filter.$and = andFilters;
    }

    // Brand filter
    if (req.query.brand) {
        filter.brand = {
            $regex: `^${req.query.brand}$`,
            $options: 'i',
        };
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    // Rating filter
    if (req.query.minRating) {
        filter.rating = { $gte: Number(req.query.minRating) };
    }

    let sortObj = { createdAt: -1 }; // default for 'featured'

    switch (req.query.sortBy) {
        case 'price-low':
            sortObj = { price: 1 };
            break;
        case 'price-high':
            sortObj = { price: -1 };
            break;
        case 'name':
            sortObj = { name: 1 };
            break;
        case 'brand':
            sortObj = { brand: 1, name: 1 };
            break;
        case 'popularity':
            sortObj = { numReviews: -1, rating: -1 };
            break;
        case 'rating':
            sortObj = { rating: -1, numReviews: -1 };
            break;
        case 'featured':
        default:
            sortObj = { createdAt: -1 }; // Default to newest-first
            break;
    }

    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort(sortObj);
    // DEBUG: log incoming queries for Gaming PCs
    if (req.query.broadCategory === 'Gaming PC') {
        console.log('Query:', req.query);
        console.log('Filter:', JSON.stringify(filter));
        console.log('Returned products count:', products.length);
    }

    res.json({
        products,
        page,
        pages: Math.ceil(count / pageSize),
        totalProducts: count,
    });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        if (isCloudinaryConfigured()) {
            // Delete primary image
            if (product.cloudinaryPublicId) {
                deleteImage(product.cloudinaryPublicId).catch(err =>
                    console.error('Cloudinary primary image delete failed (non-critical):', err.message)
                );
            }
            // Delete gallery images
            if (product.cloudinaryPublicIds?.length) {
                product.cloudinaryPublicIds.forEach(pid =>
                    deleteImage(pid).catch(err =>
                        console.error('Cloudinary gallery image delete failed (non-critical):', err.message)
                    )
                );
            }
        }

        await Product.deleteOne({ _id: product._id });
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a product (accepts full body OR creates skeleton for dashboard edit flow)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    const {
        name, price, originalPrice, description, image, cloudinaryPublicId,
        images, cloudinaryPublicIds,
        brand, category, partCategory, countInStock, specifications,
        compatibility, badge,
    } = req.body;

    const product = new Product({
        name:               name         || 'Sample Product',
        price:              price        ?? 0,
        originalPrice:      originalPrice ?? undefined,
        user:               req.user._id,
        image:              image        || '/assets/images/parts/sample.png',
        cloudinaryPublicId: cloudinaryPublicId || undefined,
        images:             Array.isArray(images) ? images : [],
        cloudinaryPublicIds: Array.isArray(cloudinaryPublicIds) ? cloudinaryPublicIds : [],
        brand:              brand        || 'Sample Brand',
        category:           category     || 'Components',
        partCategory:       partCategory || 'cpu',
        countInStock:       countInStock ?? 0,
        numReviews:         0,
        description:        description  || 'Sample description',
        specifications:     specifications || undefined,
        compatibility:      compatibility || undefined,
        badge:              badge        || undefined,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const {
        name, price, originalPrice, description,
        image, cloudinaryPublicId,
        images, cloudinaryPublicIds,
        brand, category, partCategory, countInStock,
        specifications, compatibility, badge,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        // If primary image changed, clean up old Cloudinary image
        if (image && image !== product.image && product.cloudinaryPublicId && isCloudinaryConfigured()) {
            deleteImage(product.cloudinaryPublicId).catch(err =>
                console.error('Cloudinary cleanup failed (non-critical):', err.message)
            );
        }

        product.name               = name               || product.name;
        product.price              = price              ?? product.price;
        product.originalPrice      = originalPrice      ?? product.originalPrice;
        product.description        = description        || product.description;
        product.image              = image              || product.image;
        product.cloudinaryPublicId = cloudinaryPublicId ?? product.cloudinaryPublicId;
        if (Array.isArray(images)) product.images = images;
        if (Array.isArray(cloudinaryPublicIds)) {
            // Find removed gallery images and delete them from Cloudinary
            if (isCloudinaryConfigured() && product.cloudinaryPublicIds?.length) {
                const removedIds = product.cloudinaryPublicIds.filter(id => id && !cloudinaryPublicIds.includes(id));
                removedIds.forEach(id => {
                    deleteImage(id).catch(err => console.error('Cloudinary gallery cleanup failed:', err.message));
                });
            }
            product.cloudinaryPublicIds = cloudinaryPublicIds;
        }
        product.brand              = brand              || product.brand;
        product.category           = category           || product.category;
        product.partCategory       = partCategory       || product.partCategory;
        product.countInStock       = countInStock       ?? product.countInStock;
        product.specifications     = specifications     ?? product.specifications;
        product.compatibility      = compatibility      ?? product.compatibility;
        product.badge              = badge              ?? product.badge;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        const alreadyReviewed = product.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            res.status(400);
            throw new Error('Product already reviewed');
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };

        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating =
            product.reviews.reduce((acc, item) => item.rating + acc, 0) /
            product.reviews.length;

        await product.save();
        res.status(201).json({ message: 'Review added' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ rating: -1 }).limit(6);
    res.json(products);
});

// @desc    Get all distinct categories
// @route   GET /api/products/categories
// @access  Public
const getProductCategories = asyncHandler(async (req, res) => {
    const categories = await Product.distinct('partCategory');
    res.json(categories);
});

export {
    getProducts,
    getProductById,
    deleteProduct,
    createProduct,
    updateProduct,
    createProductReview,
    getTopProducts,
    getProductCategories,
};
