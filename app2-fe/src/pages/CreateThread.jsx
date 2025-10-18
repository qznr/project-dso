import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

// Helper function
function isLoggedIn() {
  return !!localStorage.getItem("authToken");
}

// Komponen Ikon Panah Kembali (Back Arrow)
const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"></path>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

export default function CreateThread() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: title.trim(), content: content.trim() })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Thread created successfully:", data);

      // Cukup navigasi kembali ke homepage, data akan di-refetch di sana
      navigate('/');
    } catch (error) {
      console.error("Failed to create thread:", error);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header Global */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between p-4 gap-4">
          <div className="text-2xl font-bold text-gray-800 cursor-pointer" onClick={() => navigate('/')}>
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
      <main className="container max-w-2xl mx-auto py-6">
        <Card className="overflow-hidden">
          {/* Header Halaman */}
          <div className="p-4 flex items-center gap-4 border-b">
            <button onClick={() => navigate(-1)} className="hover:bg-gray-100 rounded-full p-2 transition-colors">
              <BackArrowIcon />
            </button>
            <h1 className="text-xl font-bold">Create Post</h1>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handlePublish} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="title" className="font-semibold text-gray-700">Title</label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="title"
                  className="border-gray-300"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="content" className="font-semibold text-gray-700">Content</label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Content"
                  className="border-gray-300 min-h-[150px]"
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="outline">Add Image</Button>
                <Button type="submit">Publish</Button>
              </div>
            </form>
          </div>
        </Card>
      </main>
    </div>
  );
}

