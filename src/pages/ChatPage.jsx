import { lazy } from 'react';

const ChatList = lazy(() => import('../components/chat/ChatList'));

export default function ChatPage() {
    return <ChatList />;
}
