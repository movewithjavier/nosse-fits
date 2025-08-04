# Nosse Fits - Product Requirements Document

## Executive Summary

**Product Name:** Nosse Fits  
**Version:** 1.0 (MVP)  
**Target Release:** TBD  
**Primary User:** Parent managing toddler wardrobe inventory  

Nosse Fits is a mobile-first web application designed to help parents efficiently manage and track their children's clothing inventory. The MVP focuses on simple input and viewing capabilities for toddler clothes, with plans to expand to additional family members and advanced features in future iterations.

## Product Vision & Goals

### Vision Statement
Create a simple, intuitive wardrobe management system that helps busy parents keep track of their children's clothing inventory, reducing duplicate purchases and making outfit planning effortless.

### Primary Goals
- **Simplicity**: Minimal friction for adding and viewing clothing items
- **Mobile-First**: Optimized for phone and tablet usage, particularly iPad in portrait mode
- **Scalability**: Foundation that can expand to multiple children and family members
- **Reliability**: Consistent data storage and retrieval using Supabase backend

## Target Users

### Primary User Persona: "Busy Parent"
- **Demographics**: Parent with toddler (and expecting second child)
- **Device Usage**: Primarily mobile phone and iPad (portrait orientation preferred)
- **Technical Comfort**: Basic smartphone user, values simplicity over advanced features
- **Pain Points**: 
  - Forgetting what clothes are available when shopping
  - Difficulty tracking outgrown items
  - Managing increasing inventory with multiple children

## Feature Requirements

### MVP Features (Version 1.0)

#### Core Functionality
1. **Add Clothing Item**
   - Upload photo (required)
   - Enter item name (required)
   - Add description (optional)
   - Save to database

2. **View Clothing Inventory**
   - Grid/list view of all items
   - Display photo thumbnails
   - Show item names
   - Basic search/filter capability

#### Technical Requirements
- **Platform**: Progressive Web App (PWA)
- **Primary Devices**: Mobile phones, tablets (iPad focus)
- **Orientation**: Portrait-optimized, responsive design
- **Backend**: Supabase for data storage and management
- **Image Storage**: Supabase storage for photos

### Future Considerations (Post-MVP)
- Multiple children profiles
- Size tracking and outgrown alerts
- Categories (shirts, pants, shoes, etc.)
- Season/weather tagging
- Outfit planning features
- Sharing capabilities between family members
- Adult clothing expansion

## User Stories

### MVP User Stories

**As a parent, I want to:**
- Quickly photograph and save details about my toddler's clothes so I can remember what we own
- Browse through saved clothing items with photos so I can see what's available
- Add basic information about each item so I can identify them later
- Access the app easily on my phone or tablet when I'm shopping or organizing

**Acceptance Criteria:**
- User can take/upload a photo of clothing item
- User can enter a name for the item (max 100 characters)
- User can optionally add a description (max 500 characters)
- All items are saved and retrievable
- Items display in a clean, photo-centric grid view
- App works smoothly on mobile devices in portrait mode

## Technical Architecture Overview

### Technology Stack
- **Frontend**: React/Next.js (recommended for PWA capabilities)
- **Backend**: Supabase (PostgreSQL database + Authentication + Storage)
- **Hosting**: Vercel (seamless Next.js deployment) or Netlify
- **Image Processing**: Supabase Storage with automatic optimization

### Database Schema (MVP)

```sql
-- clothing_items table
CREATE TABLE clothing_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  child_id UUID -- Future: references children table
);

-- Index for faster queries
CREATE INDEX idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX idx_clothing_items_created_at ON clothing_items(created_at DESC);
```

### API Endpoints (Supabase Auto-Generated)
- `GET /clothing_items` - Retrieve all items for user
- `POST /clothing_items` - Create new clothing item
- `PUT /clothing_items/:id` - Update existing item
- `DELETE /clothing_items/:id` - Remove item
- `POST /storage/images` - Upload image file

## User Interface Requirements

### Design Principles
- **Mobile-First**: Touch-friendly interfaces, large tap targets
- **Visual Priority**: Photos are the primary content, text is secondary
- **Simple Navigation**: Minimal menu structure, intuitive flow
- **Fast Loading**: Optimized images, progressive loading

### Key Screens

1. **Home/Inventory View**
   - Grid of clothing items (2-3 columns on phone, 3-4 on tablet)
   - Large photo thumbnails
   - Item names below photos
   - Floating "Add Item" button
   - Search bar at top

2. **Add Item Screen**
   - Large camera/upload area
   - Name input field
   - Description text area (expandable)
   - Save/Cancel buttons
   - Image preview

3. **Item Detail View** (Future consideration)
   - Full-size photo
   - Item details
   - Edit/Delete options

### Responsive Breakpoints
- **Mobile**: 320px - 768px (primary focus)
- **Tablet**: 768px - 1024px (iPad portrait: 768px × 1024px)
- **Desktop**: 1024px+ (secondary consideration)

## Development Phases

### Phase 1: MVP Development (2-4 weeks)
1. **Week 1**: Project setup, Supabase configuration, basic UI framework
2. **Week 2**: Image upload functionality, database integration
3. **Week 3**: Inventory view, responsive design implementation
4. **Week 4**: Testing, PWA optimization, deployment

### Phase 2: Enhancement (Future)
- Multiple children support
- Advanced filtering and categorization
- Outfit planning features

## Success Metrics

### MVP Success Criteria
- User can successfully add clothing items with photos
- App loads and functions properly on target devices
- Image upload and storage works reliably
- Inventory view displays items clearly and quickly
- No critical bugs in core functionality

### Future KPIs
- Daily/weekly active users
- Number of items added per user
- User retention rate
- Feature adoption rates

## Risk Assessment

### Technical Risks
- **Image upload reliability**: Mitigation through robust error handling
- **Mobile performance**: Address through image optimization and lazy loading
- **Data loss**: Prevented by Supabase's built-in backup systems

### User Adoption Risks
- **Complexity**: Mitigated by focusing on simplicity in MVP
- **Value proposition**: Regular user feedback and iterative improvements

## Launch Strategy

### MVP Launch
1. Internal testing with primary user (your wife)
2. Feedback collection and critical bug fixes
3. Soft launch for close family/friends
4. Iterative improvements based on real usage

### Post-Launch
- Monitor user behavior and feedback
- Plan Phase 2 features based on usage patterns
- Consider additional user acquisition if successful

---

*This document should be reviewed and updated as the product evolves and new requirements emerge.*