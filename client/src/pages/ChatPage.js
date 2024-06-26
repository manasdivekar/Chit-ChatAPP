import React, { useState } from "react";
import { Box } from "@chakra-ui/layout";
import { ChatState } from "../Context/ChatProvider";
import SideDrawer from "../Components/Miscelleneous/SideDrawer";
import MyChat from "../Components/MyChat";
import ChatBox from "../Components/ChatBox";

const ChatPage = () => {
  const { user } = ChatState();
  const[fetchAgain,setFetchAgain] = useState(false)

  return (
    <div style={{ width: "100%" }}>
      {user && <SideDrawer />}
      <Box display="flex" justifyContent="space-between" w="100%" h="91.5vh" p="10px">
        {user && <MyChat fetchAgain={fetchAgain}/>} 
        {user && (
          <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} /> // 
        )}
      </Box>
    </div>
  );
};

export default ChatPage;
