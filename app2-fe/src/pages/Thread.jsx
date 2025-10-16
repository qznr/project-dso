import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';

function isLoggedIn() {
  // Selalu return true untuk demonstrasi layout
  return true;
}

// Komponen untuk Ikon Panah Kembali (Back Arrow)
const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"></path>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

export default function Thread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi fetch data untuk demonstrasi layout
    setTimeout(() => {
        setThread({
            id: 1,
            username: 'Username',
            createdAt: '15.30 • 13 Oct 25',
            title: 'Thread Title',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc turpis tortor, laoreet quis est accumsan.',
            likes: 67,
            images: ['placeholder1', 'placeholder2'],
            posts: [
                {
                    id: 101,
                    username: 'Username',
                    createdAt: '15.30 • 13 Oct 25',
                    replyTo: 'Username',
                    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc turpis tortor, laoreet quis est accumsan.',
                    likes: 67,
                    comments: 1,
                    images: []
                }
            ]
        });
        setLoading(false);
    }, 1000);

    /* Kode fetch asli
    fetch(`/api/threads/${id}`)
      .then(res => res.json())
      .then(data => {
        setThread(data);
        setLoading(false);
      });
    */
  }, [id]);

  const handlePostReply = (e) => {
    e.preventDefault();
    // Tambahkan logika untuk mengirim balasan di sini
    console.log("Reply posted!");
    // Kembali ke halaman homepage setelah post
    navigate('/');
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (!thread) return <div className="text-center p-10">Thread not found</div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* ===== Header Global ===== */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="text-2xl font-bold text-gray-800 cursor-pointer" onClick={() => navigate('/')}>
            GameKom
          </div>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto py-6">
        <Card className="overflow-hidden">
            {/* Header Halaman Thread dengan Tombol Post */}
            <div className="p-4 flex items-center gap-4 border-b">
                <button onClick={() => navigate(-1)} className="hover:bg-gray-100 rounded-full p-2 transition-colors">
                    <BackArrowIcon />
                </button>
                <h1 className="text-xl font-bold">Post</h1>
            </div>

            {/* Post Utama */}
            <div className="p-6 border-b">
                <div className="flex gap-3 items-center mb-4">
                    <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
                        <AvatarFallback>U</AvatarFallback>
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
                        {thread.images.map((img, idx) => (
                            <div key={idx} className="w-1/2 h-48 bg-gray-200 rounded-md" />
                        ))}
                    </div>
                )}
                <hr className="my-3" />
                <div className="flex justify-end gap-6 text-sm text-gray-600">
                    <span>♡ {thread.likes || 0}</span>
                    <span>💬 {thread.posts?.length || 0}</span>
                </div>
            </div>

            {/* Form untuk Balasan */}
            {isLoggedIn() && (
                <div className="p-4 border-b">
                    <form onSubmit={handlePostReply}>
                        <div className="flex gap-3 items-start">
                            <Avatar>
                                <AvatarImage src="https://github.com/shadcn.png" alt="Your Avatar" />
                                <AvatarFallback>ME</AvatarFallback>
                            </Avatar>
                            <textarea
                                className="w-full border-none focus:ring-0 resize-none h-16 bg-transparent"
                                placeholder="Post your reply"
                            />
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                            <Button type="button" variant="outline" size="sm">Add Image</Button>
                            <Button type="submit" size="sm">Post</Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Daftar Balasan */}
            <div>
            {thread.posts && thread.posts.map(post => (
                <div key={post.id} className="p-6 border-b last:border-b-0">
                    <div className="flex gap-3 items-center mb-2">
                        <Avatar>
                            <AvatarImage src="https://github.com/shadcn.png" alt="Post author avatar" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-bold">@{post.username}</div>
                            <div className="text-xs text-gray-500">{post.createdAt}</div>
                        </div>
                    </div>
                    <div className="ml-12">
                        {post.replyTo && (
                            <p className="text-sm text-gray-500 mb-2">
                                Replying to <span className="text-blue-600">@{post.replyTo}</span>
                            </p>
                        )}
                        <p className="text-gray-700">{post.content}</p>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-end gap-6 text-sm text-gray-600">
                        <span>♡ {post.likes || 0}</span>
                        <span>💬 {post.comments || 0}</span>
                    </div>
                </div>
            ))}
            </div>
        </Card>
      </main>
    </div>
  );
}

