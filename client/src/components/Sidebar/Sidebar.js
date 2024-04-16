import { useDispatch, useSelector } from "react-redux";
import {
  selectIsSidebarOpen,
  toggleSidebar,
} from "../../features/dashboard/dashSlice";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import "./sidebar.css";

const Sidebar = () => {
  const isSidebarOpen = useSelector(selectIsSidebarOpen);

  const dispatch = useDispatch();

  const toggleSidebarBtn = () => dispatch(toggleSidebar());
  return (
    <>
      {isSidebarOpen && (
        <aside className="sidebar__container">
          <Box bgcolor="skyblue" sx={{ width: "30%", height: "100%" }}>
            <List>
              <ListItem>
                <ListItemButton onClick={toggleSidebarBtn}>
                  <ListItemText primary="hide" />
                </ListItemButton>
              </ListItem>
              <ListItem>
                <ListItemButton component="a" href="#found">
                  <ListItemText primary="Found" />
                </ListItemButton>
              </ListItem>
              <ListItem>
                <ListItemButton component="a" href="#lost">
                  <ListItemText primary="Lost" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </aside>
      )}
    </>
  );
};

export default Sidebar;
