import {
    Box,
    useToast,
    Text,
    IconButton,
    Spinner,
    FormControl,
    Input,
  } from "@chakra-ui/react";
  import React, { useEffect, useState } from "react";
  import { ChatState } from "../Context/ChatProvider";
  import { ArrowBackIcon } from "@chakra-ui/icons";
  import ProfileModel from "./Miscelleneous/ProfileModel";
  import { getSender, getSenderFull } from "../config/ChatLogic";
  import UpdateGroupChatModel from "./Miscelleneous/UpdateGroupChatModel";
  import axios from "axios";
  import "./style.css";
  import ScrollableChat from "./ScrollableChat";
  import io from "socket.io-client";
  import Lottie from "react-lottie";
  import animationData from '../animations/typingAnimation.json'
  // creating a endpoint
  const ENDPOINT = "http://localhost:5000";
  var socket, selectedChatCompare;
  
  const SingleChat = ({ fetchAgain, setFetchAgain }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const toast = useToast();
    const { selectedChat, setSelectedChat, user , notification, setNotification} = ChatState(); // 
  
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid slice",
        },
      };

    const fetchMessages = async () => {
      if (!selectedChat) return;
  
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        setLoading(true);
        const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);
        setMessages(data);
        setLoading(false);
  
        // socket.io connection when user clicks the chat as it will create a separate room for that user
        socket.emit("join chat", selectedChat._id);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load the messages",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    };
  
    // starting the socket.io
    useEffect(() => {
      socket = io(ENDPOINT);
      socket.emit("setup", user);
      socket.on("connected", () => {
        setSocketConnected(true);
      });
      socket.on("typing", () => setIsTyping(true));
      socket.on("stop typing", () => setIsTyping(false));
    }, []);
  
    useEffect(() => {
      fetchMessages();
      // trying to keep a backup of whatever there is inside the selected chat state
      selectedChatCompare = selectedChat;
    }, [selectedChat]);
  
    useEffect(() => {
      socket.on("message received", (newMessageReceived) => {
        if (
          !selectedChatCompare || // if chat is not selected or doesn't match current chat
          selectedChatCompare._id !== newMessageReceived.chat._id
        ) {
          if (!notification.includes(newMessageReceived)) {
            setNotification([newMessageReceived, ...notification]);
            setFetchAgain(!fetchAgain);
          }
        } else {
          setMessages([...messages, newMessageReceived]);
        }
      });
    });
  
    const sendMessage = async (event) => {
      if (event.key === "Enter" && newMessage) {
        socket.emit("stop typing", selectedChat._id);
        try {
          const config = {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          };
          setNewMessage("");
          const { data } = await axios.post(
            "/api/message",
            {
              content: newMessage,
              chatId: selectedChat._id,
            },
            config
          );
  
          socket.emit("new message", data);
  
          setMessages([...messages, data]);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to send the message",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
        }
      }
    };
  
    const typingHandler = (e) => {
      setNewMessage(e.target.value);
      // Typing indicator logic is represented here
      if (!socketConnected) return;
  
      if (!typing) {
        setTyping(true);
        socket.emit("typing", selectedChat._id);
      }
      let lastTypingTime = new Date().getTime();
      var timerLength = 3000;
  
      // throttle function
      setTimeout(() => {
        var timeNow = new Date().getTime();
        var timeDiff = timeNow - lastTypingTime;
        if (timeDiff >= timerLength && typing) {
          socket.emit("stop typing", selectedChat._id);
          setTyping(false);
        }
      }, timerLength);
    };
  
    return (
      <>
        {selectedChat ? (
          <>
            <Text
              fontSize={{ base: "28px", md: "30px" }}
              pb={3}
              px={2}
              w="100%"
              fontFamily="Work sans"
              display="flex"
              justifyContent={{ base: "space-between" }}
              alignItems="center"
            >
              <IconButton
                display={{ base: "flex", md: "none" }}
                icon={<ArrowBackIcon />}
                onClick={() => setSelectedChat("")}
              />
              {!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModel user={getSenderFull(user, selectedChat.users)} />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModel
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              )}
            </Text>
            <Box
              display="flex"
              flexDir="column"
              justifyContent="flex-end"
              p={3}
              bg="#E8E8E8"
              w="100%"
              h="100%"
              borderRadius="lg"
              overflowY="hidden"
            >
              {/* message here  */}
              {loading ? (
                <Spinner size="xl" w={20} h={20} alignSelf="center" margin="auto" />
              ) : (
                <div className="messages">
                  <ScrollableChat messages={messages} />
                </div>
              )}
  
              {/* Input tag for typing the message  */}
              <FormControl onKeyDown={sendMessage} isRequired mt={3}>
                {isTyping ? (
                  <div>
                    
                    <Lottie
                      options={defaultOptions}
                      height={50}
                      width={70}
                      style={{ marginBottom: 15, marginLeft: 0 }}
                    />
                  </div>
                ) : (
                  <></>
                )}
  
                <Input
                  variant="filled"
                  bg="rgb(202,255,255)"
                  placeholder="Enter a message.."
                  onChange={typingHandler}
                  value={newMessage}
                />
              </FormControl>
            </Box>
          </>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" h="100%">
            <Text fontSize="3xl" pb={3} fontFamily="Work Sans">
              Click On User To Start Chatting
            </Text>
          </Box>
        )}
      </>
    );
  };
  
  export default SingleChat;
  