import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useNavigate } from 'react-router-dom';

function isLoggedIn() {
  // Selalu return true untuk demonstrasi layout
  return true;
}

export default function Home() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // --- Mengambil data dari endpoint /api/threads ---
    const fetchThreads = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/threads');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Tambahkan properti `isLiked` secara default agar fitur like berfungsi
        const threadsWithLikeStatus = data.map(thread => ({ ...thread, isLiked: false }));
        setThreads(threadsWithLikeStatus);

      } catch (error) {
        console.error("Gagal mengambil data threads:", error);
        // Anda bisa menambahkan state untuk menampilkan pesan error di UI
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  // --- Fungsi untuk menangani klik pada tombol like ---
  const handleLikeClick = (e, threadId) => {
    e.stopPropagation(); // Mencegah event klik menyebar ke Card parent

    setThreads(currentThread => 
      currentThread.map(thread => {
        if (thread.id === threadId) {
          // Toggle status `isLiked` dan perbarui jumlah likes
          const newLikesCount = thread.isLiked ? thread.likes - 1 : thread.likes + 1;
          return { ...thread, likes: newLikesCount, isLiked: !thread.isLiked };
        }
        return thread;
      })
    );
    
    // Di aplikasi nyata, Anda akan memanggil API di sini untuk menyimpan perubahan
    console.log(`Toggled like for thread ID: ${threadId}`);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* ===== Header ===== */}
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

      {/* ===== Main Content ===== */}
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
                {/* --- Tombol Like yang Diperbarui --- */}
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

