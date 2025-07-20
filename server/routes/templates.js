
const express = require('express');
const router = express.Router();

const templates = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design',
    preview: '/images/templates/modern.png',
    isPremium: false
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional professional layout',
    preview: '/images/templates/classic.png',
    isPremium: false
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold and innovative design',
    preview: '/images/templates/creative.png',
    isPremium: true
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Premium professional template',
    preview: '/images/templates/executive.png',
    isPremium: true
  }
];

// Get all templates
router.get('/', (req, res) => {
  res.json(templates);
});

// Get single template
router.get('/:id', (req, res) => {
  const template = templates.find(t => t.id === req.params.id);
  if (!template) {
    return res.status(404).json({ message: 'Template not found' });
  }
  res.json(template);
});

module.exports = router;
const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Get available templates
router.get('/', async (req, res) => {
  try {
    const templates = [
      {
        id: 'modern',
        name: 'Modern',
        description: 'Clean and contemporary design',
        preview: '/templates/modern-preview.png',
        category: 'professional'
      },
      {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional and professional',
        preview: '/templates/classic-preview.png',
        category: 'professional'
      },
      {
        id: 'creative',
        name: 'Creative',
        description: 'Bold and artistic design',
        preview: '/templates/creative-preview.png',
        category: 'creative'
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Simple and clean layout',
        preview: '/templates/minimal-preview.png',
        category: 'minimal'
      }
    ];
    
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

// Get specific template
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Template structure for rendering
    const templateStructure = {
      id,
      sections: ['header', 'summary', 'experience', 'education', 'skills', 'projects'],
      styles: {
        font: 'Arial, sans-serif',
        primaryColor: '#2c3e50',
        secondaryColor: '#3498db'
      }
    };
    
    res.json(templateStructure);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch template' });
  }
});

module.exports = router;
