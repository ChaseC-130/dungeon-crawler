# Task: Add a nice animation when players drag their own unit on the grid to move it to another cell. The moving functionality works as expected, but we want to render the unit sprite as they're dragging it to another cell. Additionally, give players the ability to drag the unit off the grid and into a special area that pops up (Only when they are dragging an already purchased unit that was placed on the grid) that they can drop the unit in to sell the unit for 75% of the cost. Indicate this all to the user.

## ✅ COMPLETED

### Implementation Summary:

1. **Enhanced Drag Animation**
   - The existing drag preview system now follows the cursor smoothly with a floating, slightly animated unit sprite in a golden-bordered box
   - The original unit becomes semi-transparent (30% opacity) while being dragged
   - Visual feedback changes the drag preview border color based on valid/invalid drop zones

2. **Sell Zone Feature**
   - A red sell zone appears on the right side of the screen when dragging a unit
   - The zone slides in from the right with a smooth animation
   - Features a money bag emoji (💰), "SELL" text, and "75% Refund" label
   - Has a pulsing border effect to draw attention

3. **Visual Feedback**
   - When hovering over the sell zone, it scales up slightly and the drag preview shows the refund amount (+Xg)
   - The drag preview border turns red when over invalid drop zones
   - Clear instruction text appears at the top of the screen explaining both repositioning and selling

4. **Functionality**
   - Units can be dragged to new valid grid positions
   - Dropping a unit in the sell zone triggers the sell-unit socket event
   - The unit is sold for 75% of its original cost (as configured in server constants)
   - Appropriate sound effects play for both placement and selling

5. **User Guidance**
   - Instruction banner: "🎯 Drag to reposition | 💰 Drop in red zone to sell (75% refund)"
   - The sell zone is clearly marked and animated
   - Visual indicators update in real-time based on cursor position

The implementation provides an intuitive drag-and-drop experience with clear visual feedback and smooth animations throughout the interaction.