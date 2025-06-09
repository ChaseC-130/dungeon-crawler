# Task 1: The functionality is supposed to be implemented already in which allows players to click + drag their own units (Or press + drag on mobile) on the grid to relocate them to other cells. The functionality implemented does not work at all. Re-implement this functionality and ensure any old code that was intended for this functionality is either removed or cleaned up. It seems to make units slightly larger when i press on them on the grid cell, but it doesn't let me drag them. The animation should look very similar to like when a player presses + drags a unit to purchase then drops on the grid, except this should just let the player move one of their units to another cell.

### Subtasks:
- [x] Debug why current drag functionality only scales but doesn't drag
- [x] Check Phaser drag system configuration and input manager
- [x] Study shop unit drag implementation for reference
- [x] Fix or reimplement grid unit drag functionality  
- [x] Test drag behavior matches shop unit drag visuals
- [x] Ensure proper cleanup of drag events

# Task 2: Players should be able to sell units they own by clicking on them during preparation phase on the grid to bring up a sell menu and sell them for 75% of the purchase price (Rounded up). Let's change this popup to be a tooltip, not a modal.

### Subtasks:
- [ ] Replace sell modal with tooltip-style popup
- [ ] Change sell price calculation to round up instead of down
- [ ] Position tooltip near clicked unit
- [ ] Add dismiss functionality for tooltip
- [ ] Style tooltip to match game design
- [ ] Test tooltip positioning and responsiveness

# Task 3: The upgrade selection panel cards have their borders cut off, let's size down the cards and increase the size of the boxes for the upgrade icons and the unit sprites.

### Subtasks:
- [ ] Identify current upgrade card dimensions and why borders are cut off
- [ ] Reduce upgrade card sizes to fit properly
- [ ] Increase upgrade icon container sizes
- [ ] Increase unit sprite container sizes in upgrade cards
- [ ] Test layout on different screen sizes
- [ ] Ensure all upgrade content fits within cards