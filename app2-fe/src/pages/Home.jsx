import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageSquare } from 'lucide-react';
import { toast } from 'sonner'; 

// --- Utility Functions ---

function isLoggedIn() {
    return !!localStorage.getItem("authToken");
}

function getCurrentUser() {
    const userProfileString = localStorage.getItem("userProfile");
    if (userProfileString) {
        try {
            return JSON.parse(userProfileString);
        } catch (e) {
            return null;
        }
    }
    return null;
}

const apiUrl = import.meta.env.VITE_API_URL;

// Placeholder untuk debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

// --- Component: ThreadCard ---

const ThreadCard = ({ thread, navigate, onLikeClick }) => {
    // Fungsi untuk mensanitasi konten (VULNERABLE XSS SIMULATION)
    const renderContent = (content) => {
        // PERHATIAN: Ini adalah implementasi SANGAT TIDAK AMAN yang sengaja 
        // digunakan untuk mensimulasikan dan menguji kerentanan XSS (A03)
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
    };

    const threadUrl = `/thread/${thread.id}`;
    const handleCardClick = () => navigate(threadUrl);

    // Ambil inisial untuk AvatarFallback
    const initials = thread.username ? thread.username[0].toUpperCase() : 'U';

    return (
        <Card 
            className="p-4 cursor-pointer hover:bg-gray-50 transition" 
            onClick={handleCardClick}
        >
            <div className="flex gap-3 items-center mb-3">
                <Avatar className="size-10">
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-bold text-gray-800">@{thread.username}</div>
                    <div className="text-xs text-gray-500">
                        {new Date(thread.createdAt).toLocaleTimeString()} • {new Date(thread.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <h2 className="font-semibold text-lg">{thread.title}</h2>
                
                {/* Thread Content - VULNERABLE XSS */}
                <div className="text-gray-700 mb-2">
                    {renderContent(thread.content)}
                </div>
            </div>

            {/* Media/Attachments */}
            {thread.images && thread.images.length > 0 && (
                <div className="flex flex-wrap gap-2 my-3">
                    {thread.images.slice(0, 2).map((img, index) => (
                        <div key={index} className="w-full h-48 bg-gray-200 rounded-md sm:w-[calc(50%-4px)] overflow-hidden">
                             {/* Menampilkan Attachment - VULNERABLE RCE/Path Traversal */}
                             <img 
                                src={`${apiUrl}/${img}`} 
                                alt={`Attachment ${index}`} 
                                className="object-cover w-full h-full" 
                                onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = "https://via.placeholder.com/150?text=Image+Error";
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
            
            <hr className="my-3"/>
            
            {/* Footer Interaksi */}
            <div className="flex justify-end gap-6 text-sm text-gray-600">
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Mencegah klik card
                        onLikeClick(thread.id, thread.isLiked);
                    }}
                    className={`flex items-center gap-1 transition-colors ${
                        thread.isLiked ? 'text-red-500' : 'hover:text-red-500'
                    }`}
                >
                    <Heart className="w-4 h-4" fill={thread.isLiked ? 'red' : 'none'} /> 
                    {thread.likes || 0}
                </button>
                <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" /> {thread.postsCount || 0}
                </span>
            </div>
        </Card>
    );
};


export default function Home() {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = getCurrentUser();

    // Debounce state untuk search 
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const fetchThreads = useCallback(async (query) => {
        setLoading(true);
        try {
            // Logika untuk menentukan endpoint (pencarian vs. daftar semua)
            const endpoint = query 
                ? `${apiUrl}/threads/search?q=${query}` // VULNERABLE SQLi
                : `${apiUrl}/threads`;
            
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                // Menangani kegagalan yang mungkin disebabkan oleh SQLi
                if (query) {
                    throw new Error(`Search failed. Response status: ${response.status}. (Check A03: SQLi)`);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Logika untuk memetakan respons dari API utama dan API search
            const rawThreads = Array.isArray(data.data) ? data.data : [data.data].filter(Boolean);

            const mappedThreads = rawThreads.map(thread => ({
                id: thread.thread_id || thread.id, 
                title: thread.title,
                content: thread.content,
                // Mengambil username dari author (jika ada) atau author_username (dari queryRawUnsafe)
                username: thread.author?.username || thread.author_username || 'Unknown', 
                createdAt: thread.created_at,
                // Gunakan 0 jika tidak ada properti _count (kasus search)
                likes: thread._count?.threadLikes || 0,
                postsCount: thread._count?.posts || 0,
                images: thread.attachments?.map(att => att.file_path) || [],
                isLiked: false 
            }));

            setThreads(mappedThreads);

        } catch (error) {
            console.error("Gagal mengambil data threads:", error);
            if (error.message.includes('SQLi')) {
                toast.error("SQL Injection Detected (A03)", { description: error.message });
            } else {
                toast.error("Failed to load threads.", { description: error.message });
            }
            setThreads([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchQuery]); 

    useEffect(() => {
        fetchThreads(debouncedSearchQuery);
    }, [fetchThreads, debouncedSearchQuery]); 

    // Handle like/unlike (placeholder frontend logic)
    const handleLikeClick = (threadId, isLiked) => {
        // Di sini Anda akan memanggil API /threads/:id/like
        if (!isLoggedIn()) {
            return toast.warning("Login required to like posts.");
        }
        
        // Placeholder untuk toggle state
        setThreads(currentThread => 
            currentThread.map(thread => {
                if (thread.id === threadId) {
                    const newLikesCount = isLiked ? thread.likes - 1 : thread.likes + 1;
                    // Di aplikasi nyata, Anda akan menunggu respons API
                    return { ...thread, likes: newLikesCount, isLiked: !isLiked }; 
                }
                return thread;
            })
        );
        
        // API call to toggle like goes here
        console.log(`Toggling like API call for thread ID: ${threadId}`);
    };

    const initials = currentUser?.username ? currentUser.username[0].toUpperCase() : 'U';

    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto flex items-center justify-between p-4 gap-4 max-w-4xl">
                    <div className="text-2xl font-bold text-gray-800 cursor-pointer" onClick={() => navigate('/')}>
                        GameKom
                    </div>
                    <div className="flex-1 max-w-lg relative">
                        <input 
                            className="border bg-gray-50 rounded-full px-4 py-2 w-full pl-10" 
                            placeholder="Search" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                         <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">🔍</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoggedIn() ? (
                            <>
                                <Button onClick={() => navigate('/create-thread')} className="rounded-full">Post</Button>
                                <Avatar onClick={() => navigate('/profile')} className="cursor-pointer size-10">
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                            </>
                        ) : (
                            <Button onClick={() => navigate('/login')} className="rounded-full">Login</Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container max-w-2xl mx-auto flex flex-col gap-4 py-6">
                <h1 className="text-2xl font-bold text-gray-800 pl-2">Homepage</h1>
                {loading ? (
                    <Card className="p-6 text-center">Loading threads...</Card>
                ) : threads.length === 0 ? (
                    <Card className="p-6 text-center text-gray-500">
                        {searchQuery ? `No threads found for "${searchQuery}".` : "No threads found."}
                    </Card>
                ) : (
                    threads.map(thread => (
                        <ThreadCard 
                            key={thread.id} 
                            thread={thread} 
                            navigate={navigate} 
                            onLikeClick={handleLikeClick}
                        />
                    ))
                )}
            </main>
        </div>
    );
}