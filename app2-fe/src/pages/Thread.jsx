import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useNavigate, useLocation } from 'react-router-dom'; // 1. Impor useLocation

function isLoggedIn() {
  return !!localStorage.getItem("authToken");
}

export default function Home() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // 2. Dapatkan objek lokasi

  // 3. useEffect sekarang akan berjalan setiap kali Anda menavigasi ke halaman ini
  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/threads');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const mappedThreads = data.data.map(thread => ({
          id: thread.thread_id,
          title: thread.title,
          content: thread.content,
          username: thread.author.username,
          createdAt: new Date(thread.created_at).toLocaleString(),
          likes: thread._count.threadLikes,
          postsCount: thread._count.posts,
          images: thread.attachments?.map(att => att.file_path) || [],
          isLiked: false // Anda bisa menambahkan logika untuk memeriksa status like dari API
        }));

        setThreads(mappedThreads);

      } catch (error) {
        console.error("Gagal mengambil data threads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [location]); // useEffect akan dijalankan ulang jika 'location' berubah

  // Fungsi untuk menangani klik pada tombol like
  const handleLikeClick = (e, threadId) => {
    e.stopPropagation();

    setThreads(currentThread => 
      currentThread.map(thread => {
        if (thread.id === threadId) {
          const newLikesCount = thread.isLiked ? thread.likes - 1 : thread.likes + 1;
          return { ...thread, likes: newLikesCount, isLiked: !thread.isLiked };
        }
        return thread;
      })
    );
    
    // Di aplikasi nyata, Anda akan memanggil API like/unlike di sini
    console.log(`Toggled like for thread ID: ${threadId}`);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between p-4 gap-4">
          <div className="text-2xl font-bold text-gray-800">
            GameKom
          </div>
          <div className="flex-1 max-w-md">
            <input 
              className="border bg-gray-50 rounded-md px-4 py-2 w-full" 
              placeholder="🔍 Search" 
            />
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn() && (
              <Button onClick={() => navigate('/create-thread')}>Post</Button>
            )}
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto flex flex-col gap-4 py-6">
        {loading ? (
          <Card className="p-6 text-center">Loading threads...</Card>
        ) : (
          threads.map(thread => (
            <Card key={thread.id} className="p-6 cursor-pointer hover:bg-gray-50 transition" onClick={() => navigate(`/thread/${thread.id}`)}>
              <div className="flex gap-3 items-center mb-4">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="Thread author" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold">@{thread.username}</div>
                  <div className="text-xs text-gray-500">{thread.createdAt}</div>
                </div>
              </div>
              <div className="font-semibold text-lg mb-2">{thread.title}</div>
              <p className="text-gray-700 mb-4">{thread.content}</p>
              {thread.images && thread.images.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {thread.images.map((img, index) => (
                    <div key={index} className="w-1/2 h-48 bg-gray-200 rounded-md"></div>
                  ))}
                </div>
              )}
              <hr className="my-3"/>
              <div className="flex justify-end gap-6 text-sm text-gray-600">
                <button
                  onClick={(e) => handleLikeClick(e, thread.id)}
                  className={`flex items-center gap-1 transition-colors ${
                    thread.isLiked ? 'text-red-500' : 'hover:text-red-500'
                  }`}
                >
                  {thread.isLiked ? '♥' : '♡'} {thread.likes || 0}
                </button>
                <span className="flex items-center gap-1">💬 {thread.postsCount || 0}</span>
              </div>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}

