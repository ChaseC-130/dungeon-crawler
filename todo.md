# Sprites on the Unit Selection Modal, the shop screen of your selected units, and the upgrade available panel do not match the sprites rendered in the grid cells. They are often misaligned, show multiple sprites from spritesheet, and do not loop their idle animation. The preparation phase grid sprite should be used consistently across the other interfaces. An example is shown in client1.png screenshot where it can be clearly be seen the goblin sprite shows two sprites when it should show one as it does when it's placed on the grid.


# When a player hovers over a cell, other players should see their color hovering over the cell. client1.png and client2.png were both taken at the same time, for some reason one player hovers show red cells. Let's always make the cell highlight the same color as the player's color. Additionally, only show other player's highlighted cells when they are purchasing/placing a unit, or moving a unit.

# The game is not properly returning to the grid/preparation phase style background follow the battle end. This was supposed to be fixed previously but it still is not. The game seems to freeze when 1-2 enemies are still alive for all players then goes to upgrade screen, then back to battlefield instead of grid

# Players should be able to drag their own units on the grid and drop them in other cells to move them. This was supposed to be implemented previously, but it is still not working.
