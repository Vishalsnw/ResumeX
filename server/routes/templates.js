
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
