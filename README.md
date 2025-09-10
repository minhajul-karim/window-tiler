# Tiling Window Manager

A React-based tiling window system similar to modern window managers found in Windows and macOS, allowing users to create, drag, and snap windows into organized layouts.

## 🎯 The Problem

Build a dynamic window management system where:

1. **Window Creation**: Users can create floating windows using a "+" button
2. **Drag & Drop**: Windows can be dragged around the screen by their title bars
3. **Smart Snapping**: Windows snap to screen edges and existing windows when dragged within 30px
4. **Nested Layouts**: Snapped windows can be further subdivided (e.g., snap a window to the left, then snap another to the left window's top half)
5. **Dynamic Expansion**: When a snapped window is closed, adjacent windows expand to fill the space
6. **Drag Out**: Snapped windows can be dragged back to floating state

The challenge was to handle complex spatial relationships and nested window layouts while maintaining a clean, performant user interface.

## ✅ What Works

### Core Window Management
- **Dynamic window creation** with random colors and positions
- **Smooth drag and drop** with proper offset calculations
- **Window deletion** with proper cleanup
- **Floating window management** (fully functional)

### Basic Snapping
- **Screen edge detection** (left, right, top, bottom)
- **Snap indicators** with visual feedback
- **Simple layout creation** (two windows side by side)
- **Coordinate system consistency** using absolute pixels

### Tree Data Structure
- **Spatial partitioning tree** implementation
- **Container and window nodes** with proper hierarchy
- **Recursive tree operations** (find, remove, render)
- **Tree traversal** for rendering and manipulation

## 🚧 What's Incomplete or Buggy

#### 1. **Windows are not snapping to nested sides**
#### 2. **The other windows are not growing and shrinking properly**


## 🎓 What I Learned

### Data Structures & Algorithms

#### **Tree Structures**
- **Binary vs Spatial Trees**: Learned the difference between BSTs (for ordering) and spatial partitioning trees (for 2D layouts)
- **Tree Traversal**: Implemented recursive traversal for rendering, searching, and manipulation
- **Tree Balancing**: Understanding when to promote nodes and collapse unnecessary containers

```javascript
// Key insight: Tree structure mirrors spatial relationships
Container (horizontal)
├── Window A [left half]
└── Container (vertical) [right half]
    ├── Window B [top-right quarter]
    └── Window C [bottom-right quarter]
```

## 🚀 Next Steps

To complete this implementation, I would:

1. **Implement the logic so that windows can be snapped nested inside parent windows.**
2. **Handle logic for windows to grow & shrink properly keeping in mind their nested behaviour.**
