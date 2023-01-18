import React, {useState} from 'react';
import {over} from 'stompjs'
import SockJS from 'sockjs-client';

// once user connects then this term client will get value
var stompClient=null;
const ChatRoom = () => {
    // chat array
    const [publicChats, setPublicChats] = useState([]);
    const [privateChats, setPrivateChats] = useState(new Map());    // structure each key holds the username and the value is the list of message
    const [tab, setTab] = useState("CHATROOM");  // tab to change chat user
    // simple use state
    const [userData, setUserData] = useState({
        username: "",
        receiverName: "",
        connected:false,
        message:""
    })

    // change username
    const handleValue =(event)=>{
        const {value,name}=event.target;
        // here only change username and keeping all the other variables
        // so use three dots followed by the userData here
        setUserData({...userData,[name]:value});
    }

    // register user
    // connect to websocket by sockjs
    const registerUser = ()=>{
        let Sock=new SockJS('http://localhost:8080/ws');
        stompClient=over(Sock);
        stompClient.connect({},onConnected,onError);
    }

    const onConnected =()=>{
        // update connected to true
        console.log(userData);
        setUserData({...userData,"connected":true});
        stompClient.subscribe('/chatroom/public', onPublicMessageReceived);
        stompClient.subscribe('/user/'+userData.username+'/private', onPrivateMessageReceived);
        userJoin();
    }

    const userJoin = () => {
        let chatMessage = {
            senderName: userData.username,
            status: 'JOIN'
        };

        stompClient.send('/app/message', {}, JSON.stringify(chatMessage));
        // setUserData({...userData,"message":""});
    }

    const onPublicMessageReceived = (payload) =>{
        let payloadData = JSON.parse(payload.body);
        switch(payloadData.status){
            case "JOIN":
                if (!privateChats.get(payloadData.senderName)) {
                    privateChats.set(payloadData.senderName, []);
                    setPrivateChats(new Map(privateChats));
                }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                // create new one array, copying this array
                // because whenever I'm alerting then it won't be regarded as state change 
                // whenever we create a new array that's when it will be regarded as a state change
                // create new array and ... copy publicChats
                setPublicChats([...publicChats]);
                break;
        }
    }

    const onPrivateMessageReceived = (payload) =>{
        console.log("onPrivateMessageReceived")
        // desturcture, and put it in the particular key
        let payloadData = JSON.parse(payload.body);
        if (privateChats.get(payloadData.senderName)) {
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats)); // create new object for state change
        } else {
            let list = [];
            list.push(payloadData);
            privateChats.set(payloadData.senderName, list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const onError=(err)=>{
        console.log(err);
    }

    const sendPublicMessage = () => {
        if (stompClient) {
            let chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status: 'MESSAGE'
            };
            stompClient.send('/app/message', {}, JSON.stringify(chatMessage));
            // init input content
            setUserData({...userData, "message":""});
        }
    }

    const sendPrivateMessage = () => {
        if (stompClient) {
            let chatMessage = {
                senderName: userData.username,
                receiverName: tab,
                message: userData.message,
                status: 'MESSAGE'
            };
            // whenever we are sending a msg to the particular private msg then you will be receviing only the msg are just sent to you are not having the msg 
            // if sending the msg to ourself in this case anyone will be receiving the msg directly from the server
            // so we don't need to create two diff msg
            if (userData.username !== tab) {
                privateChats.get(tab).push(chatMessage);
                setPrivateChats(new Map(privateChats));
            }
            stompClient.send('/app/private-message', {}, JSON.stringify(chatMessage));
            // init input content
            setUserData({...userData, "message":""});
        }
    }

    return (
        <div className="container">
            {userData.connected?
            <div className="chat-box">
                <div className='member-list'>
                    <p>{userData.username}</p>
                    <ul>
                        <li onClick={()=>[setTab("CHATROOM")]} className={`member ${tab==="CHATROOM" && "active"}`}>Chatroom</li>
                        {[...privateChats.keys()].map((name, index) => (
                            <li onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>
                                {name}
                            </li>
                        ))}
                    </ul>
                </div>
                {tab === "CHATROOM" && <div className='chat-content'>
                    <ul className='chat-messages'>
                        {publicChats.map((chat, index) => (
                            <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                <div className='message-data'>{chat.message}</div>
                                {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                            </li>
                        ))}
                    </ul>
                    <div className='send-message'>
                        <input type='text' className='input-message' 
                            name='message' placeholder='enter public message' value={userData.message}
                            onChange={handleValue}/>
                        <button type='button' className='send-button' onClick={sendPublicMessage}>send</button>
                    </div>
                </div>}
                {tab !== "CHATROOM" && <div className='chat-content'>
                    <ul className='chat-messages'>
                        {[...privateChats.get(tab)].map((chat, index) => (
                            <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                <div className='message-data'>{chat.message}</div>
                                {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                            </li>
                        ))}
                    </ul>
                    <div className='send-message'>
                        <input type='text' className='input-message'
                            name='message' placeholder={`enter private message for ${tab}`} value={userData.message}
                            onChange={handleValue}/>
                        <button type='button' className='send-button' onClick={sendPrivateMessage}>send</button>
                    </div>
                    
                </div>}
            </div>
            :
            <div className="register">
                <input
                    id='user-name'
                    name='username'
                    placeholder='Enter the user name'
                    value={userData.username}
                    onChange={handleValue}
                    margin="normal"
                />
                <button type='button' onClick={registerUser}>
                    connect
                </button>
            </div>}
        </div>
    )
}

export default ChatRoom
