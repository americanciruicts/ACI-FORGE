-- Cleanup script to remove x_tool and y_tool from database
-- Run this script to clean up existing tool data

-- Remove user-tool associations for x_tool and y_tool
DELETE FROM user_tools 
WHERE tool_id IN (
    SELECT id FROM tools WHERE name IN ('x_tool', 'y_tool')
);                    

-- Remove the tools themselves
DELETE FROM tools WHERE name IN ('x_tool', 'y_tool');

-- Verify cleanup
SELECT name, display_name FROM tools;
SELECT COUNT(*) as remaining_tool_assignments FROM user_tools;