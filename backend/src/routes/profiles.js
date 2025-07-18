const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { validate, profileUpdateSchema } = require('../utils/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get current user's profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
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
        }
      }
    });
    
    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Profile not found'
      });
    }
    
    // Get following and followers count
    const followStats = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        _count: {
          select: {
            following: true,
            followers: true
          }
        }
      }
    });
    
    res.json({
      profile: {
        ...profile,
        likesCount: profile._count.likes,
        followingCount: followStats._count.following,
        followersCount: followStats._count.followers
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

// Update current user's profile
router.put('/me', authenticateToken, validate(profileUpdateSchema), async (req, res) => {
  try {
    const { name, bio, headline, interests } = req.validatedData;
    
    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: {
        name,
        bio,
        headline,
        interests
      },
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
        }
      }
    });
    
    // Get following and followers count
    const followStats = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        _count: {
          select: {
            following: true,
            followers: true
          }
        }
      }
    });
    
    res.json({
      message: 'Profile updated successfully',
      profile: {
        ...updatedProfile,
        likesCount: updatedProfile._count.likes,
        followingCount: followStats._count.following,
        followersCount: followStats._count.followers
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
});

// Delete current user's profile and account
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    await prisma.$transaction(async (prisma) => {
      // Delete profile (this will cascade to user due to onDelete: Cascade)
      await prisma.profile.delete({
        where: { userId: req.user.id }
      });
      
      // Delete user
      await prisma.user.delete({
        where: { id: req.user.id }
      });
    });
    
    res.json({
      message: 'Profile and account deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete profile'
    });
  }
});

// Update profile photo URL
router.put('/me/photo', authenticateToken, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    
    if (!photoUrl) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Photo URL is required'
      });
    }
    
    const updatedProfile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: {
        photoUrl
      },
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
        }
      }
    });
    
    res.json({
      message: 'Profile photo updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update profile photo error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile photo'
    });
  }
});

// Get user's following list
router.get('/following', authenticateToken, async (req, res) => {
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: req.user.id },
      include: {
        following: {
          include: {
            profile: true,
            _count: {
              select: {
                followers: true,
                following: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const followingList = following.map(follow => ({
      id: follow.following.id,
      email: follow.following.email,
      profile: follow.following.profile,
      followersCount: follow.following._count.followers,
      followingCount: follow.following._count.following,
      followedAt: follow.createdAt
    }));
    
    res.json({
      following: followingList,
      count: followingList.length
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get following list'
    });
  }
});

// Get user's followers list
router.get('/followers', authenticateToken, async (req, res) => {
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: req.user.id },
      include: {
        follower: {
          include: {
            profile: true,
            _count: {
              select: {
                followers: true,
                following: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const followersList = followers.map(follow => ({
      id: follow.follower.id,
      email: follow.follower.email,
      profile: follow.follower.profile,
      followersCount: follow.follower._count.followers,
      followingCount: follow.follower._count.following,
      followedAt: follow.createdAt
    }));
    
    res.json({
      followers: followersList,
      count: followersList.length
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get followers list'
    });
  }
});

module.exports = router;