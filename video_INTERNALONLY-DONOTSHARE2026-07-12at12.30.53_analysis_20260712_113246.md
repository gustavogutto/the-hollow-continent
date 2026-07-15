Based on the video, when the knight character moves toward the bottom-right (south-east), the animation issue is that the character is **sliding without animating**. 

Here is a frame-by-frame breakdown of this movement:
*   **00:05:** The character is stationary, facing the bottom-left.
*   **00:06:** The character begins moving toward the bottom-right. The sprite turns to face the correct direction, but it is stuck in a single, static pose. The legs do not move to simulate walking; instead, the sprite simply translates across the screen.
*   **00:07:** The character continues moving to the bottom-right. The sprite remains in the exact same static pose as the previous frame, continuing to slide.
*   **00:08:** The character arrives at the destination tile next to the NPC. The sprite is still frozen in that same single frame. 

In contrast, when the character moves in other directions (like top-left or bottom-left), you can clearly see the legs moving in a proper walking cycle.