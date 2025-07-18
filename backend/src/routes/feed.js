const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { optionalAuth, authenticateToken } = require('../middleware/auth');
const { validateQuery, feedQuerySchema } = require('../utils/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get public feed with pagination and filters
router.get('/', optionalAuth, validateQuery(feedQuerySchema), async (req, res) => {
  try {
    const { page, limit, search, interests } = req.validatedQuery;
    const skip = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {
      isActive: true,
      ...(req.user && { userId: { not: req.user.id } }) // Exclude current user
    };
    
    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Add interests filter
    if (interests) {
      const interestList = interests.split(',').map(i => i.trim());
      whereClause.interests = {
        hasSome: interestList
      };
    }
    
    // Get profiles with pagination
    const profiles = await prisma.profile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            likes: true
          }
        },
        ...(req.user && {
          likes: {
            where: { userId: req.user.id },
            select: { id: true }
          }
        })
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
    
    // Get total count for pagination
    const totalCount = await prisma.profile.count({
      where: whereClause
    });
    
    // Format response
    const formattedProfiles = await Promise.all(
      profiles.map(async (profile) => {
        // Get follow stats for each profile
        const followStats = await prisma.user.findUnique({
          where: { id: profile.userId },
          select: {
            _count: {
              select: {
                following: true,
                followers: true
              }
            }
          }
        });
        
        // Check if current user is following this profile
        let isFollowing = false;
        if (req.user) {
          const followRelation = await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: req.user.id,
                followingId: profile.userId
              }
            }
          });
          isFollowing = !!followRelation;
        }
        
        return {
          ...profile,
          likesCount: profile._count.likes,
          followingCount: followStats._count.following,
          followersCount: followStats._count.followers,
          isLiked: req.user ? profile.likes.length > 0 : false,
          isFollowing,
          likes: undefined, // Remove likes array from response
          _count: undefined // Remove _count from response
        };
      })
    );
    
    res.json({
      profiles: formattedProfiles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get feed'
    });
  }
});

// Get specific user profile
router.get('/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            likes: true
          }
        },
        ...(req.user && {
          likes: {
            where: { userId: req.user.id },
            select: { id: true }
          }
        })
      }
    });
    
    if (!profile || !profile.isActive) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }
    
    // Get follow stats
    const followStats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            following: true,
            followers: true
          }
        }
      }
    });
    
    // Check if current user is following this profile
    let isFollowing = false;
    if (req.user && req.user.id !== userId) {
      const followRelation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: userId
          }
        }
      });
      isFollowing = !!followRelation;
    }
    
    res.json({
      profile: {
        ...profile,
        likesCount: profile._count.likes,
        followingCount: followStats._count.following,
        followersCount: followStats._count.followers,
        isLiked: req.user ? profile.likes.length > 0 : false,
        isFollowing,
        likes: undefined,
        _count: undefined
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get profile'
    });
  }
});

// Like/unlike a profile
router.post('/:userId/like', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot like your own profile'
      });
    }
    
    // Check if profile exists
    const profile = await prisma.profile.findUnique({
      where: { id: userId }
    });
    
    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }
    
    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_profileId: {
          userId: req.user.id,
          profileId: profile.id
        }
      }
    });
    
    let liked = false;
    
    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      liked = false;
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId: req.user.id,
          profileId: profile.id
        }
      });
      liked = true;
    }
    
    // Get updated like count
    const likesCount = await prisma.like.count({
      where: { profileId: profile.id }
    });
    
    res.json({
      message: liked ? 'Profile liked successfully' : 'Profile unliked successfully',
      liked,
      likesCount
    });
  } catch (error) {
    console.error('Like profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to like profile'
    });
  }
});

// Follow/unfollow a user
router.post('/:userId/follow', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot follow yourself'
      });
    }
    
    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!targetUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }
    
    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: userId
        }
      }
    });
    
    let following = false;
    
    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id }
      });
      following = false;
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: req.user.id,
          followingId: userId
        }
      });
      following = true;
    }
    
    // Get updated follow counts
    const followStats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    });
    
    res.json({
      message: following ? 'User followed successfully' : 'User unfollowed successfully',
      following,
      followersCount: followStats._count.followers,
      followingCount: followStats._count.following
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to follow user'
    });
  }
});

// Get trending interests
router.get('/trending/interests', async (req, res) => {
  try {
    // Get all interests with count
    const profiles = await prisma.profile.findMany({
      where: { isActive: true },
      select: { interests: true }
    });
    
    const interestCounts = {};
    profiles.forEach(profile => {
      profile.interests.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
      });
    });
    
    // Sort by count and get top 20
    const trendingInterests = Object.entries(interestCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([interest, count]) => ({ interest, count }));
    
    res.json({
      trending: trendingInterests
    });
  } catch (error) {
    console.error('Get trending interests error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get trending interests'
    });
  }
});

module.exports = router;