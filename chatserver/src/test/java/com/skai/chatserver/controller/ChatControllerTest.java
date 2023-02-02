package com.skai.chatserver.controller;

import com.skai.chatserver.controller.model.Message;
import com.skai.chatserver.controller.model.Status;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.messaging.converter.ByteArrayMessageConverter;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.converter.StringMessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.util.List;
import java.util.concurrent.*;

import static java.util.concurrent.TimeUnit.SECONDS;
import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ChatControllerTest {

    // establish real connection to out locally running Spring Boot App
    @LocalServerPort
    private Integer port;

    WebSocketStompClient webSocketStompClient;

    @BeforeEach
    void setup() throws ExecutionException, InterruptedException, TimeoutException {
        // client setting
        this.webSocketStompClient = new WebSocketStompClient(
                new SockJsClient(List.of(new WebSocketTransport(new StandardWebSocketClient())))
        );



        // pick one or use the default SimpleMessageConverter
        webSocketStompClient.setMessageConverter(new StringMessageConverter());
//        webSocketStompClient.setMessageConverter(new ByteArrayMessageConverter());
//        webSocketStompClient.setMessageConverter(new MappingJackson2MessageConverter());
    }

    @Test
    void verifyGreetingMessage() throws Exception {

        BlockingQueue<String> blockingQueue = new ArrayBlockingQueue<>(1);

        webSocketStompClient.setMessageConverter(new StringMessageConverter());

        // create WebSocket client, used session to verify the behavior of our application.
        StompSession session = webSocketStompClient.connect(String.format(getWsPath(), port), new StompSessionHandlerAdapter() {
        }).get(1, SECONDS);

        session.subscribe("/chatroom/public", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return String.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                blockingQueue.add((String) payload);
            }
        });

        session.send("/app/welcome", "Alen");
        await()
                .atMost(1, SECONDS)
                .untilAsserted(() -> assertEquals("Hello, Alen!", blockingQueue.poll()));
    }

    @Test
    void VerifyPublicMessage() throws Exception {
        CountDownLatch latch = new CountDownLatch(1);

        webSocketStompClient.setMessageConverter(new MappingJackson2MessageConverter());

        StompSession session = webSocketStompClient.connect(String.format(getWsPath(), port), new StompSessionHandlerAdapter() {
        }).get(1, SECONDS);

        session.subscribe("/chatroom/public", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Message.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                latch.countDown();
            }
        });

        session.send("/app/chatroom/message", "Alen");
        await()
                .atMost(1, SECONDS)
                .untilAsserted(() -> assertEquals(1, latch.getCount()));
    }

    @Test
    void VerifyPrivateMessage() throws Exception {
        CountDownLatch latch = new CountDownLatch(1);

        webSocketStompClient.setMessageConverter(new MappingJackson2MessageConverter());

        StompSession session = webSocketStompClient.connect(String.format(getWsPath(), port), new StompSessionHandlerAdapter() {
        }).get(1, SECONDS);

        session.subscribe("/chatroom/public", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Message.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                latch.countDown();
            }
        });

        session.send("/app/private-message", "Alen");
        await()
                .atMost(1, SECONDS)
                .untilAsserted(() -> assertEquals(1, latch.getCount()));
    }

    private String getWsPath() {
        return String.format("ws://localhost:%d/ws", port);
    }
}