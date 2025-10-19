// app2-fe/src/pages/Home.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../components/ui/dropdown-menu'; // Import DropdownMenu components
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageSquare, LogOut, User } from 'lucide-react'; // Import icons
import { toast } from 'sonner'; 
import { useAuthLogout } from '../App'; // Import useAuthLogout

// --- Utility Functions ---
const apiUrl = import.meta.env.VITE_API_URL;

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

function resolveImageUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${apiUrl}/${path}`; 
}

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

// --- Component: ThreadCard (Tidak berubah) ---
const ThreadCard = ({ thread, navigate, onLikeClick }) => {
    const renderContent = (content) => {
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
    };

    const threadUrl = `/thread/${thread.id}`;
    const handleCardClick = () => navigate(threadUrl);

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
                
                <div className="text-gray-700 mb-2">
                    {renderContent(thread.content)}
                </div>
            </div>

            {thread.images && thread.images.length > 0 && (
                <div className="flex flex-wrap gap-2 my-3">
                    {thread.images.slice(0, 2).map((img, index) => (
                        <div key={index} className="w-full h-48 bg-gray-200 rounded-md sm:w-[calc(50%-4px)] overflow-hidden">
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
            
            <div className="flex justify-end gap-6 text-sm text-gray-600">
                <button
                    onClick={(e) => {
                        e.stopPropagation(); 
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
    const currentUser = getCurrentUser();
    const { forceLogout } = useAuthLogout(); // Gunakan forceLogout
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    
    const [profilePictureUrl, setProfilePictureUrl] = useState("");

    const fetchUserProfile = useCallback(async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        try {
            const res = await fetch(`${apiUrl}/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const path = data.data.profile_picture_path;
                setProfilePictureUrl(path ? resolveImageUrl(path) : "");
            }
        } catch (error) {
            console.error("Failed to fetch profile picture path:", error);
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchUserProfile();
        }
    }, [currentUser, fetchUserProfile]);


    const fetchThreads = useCallback(async (query) => {
        setLoading(true);
        try {
            const endpoint = query 
                ? `${apiUrl}/threads/search?q=${query}` 
                : `${apiUrl}/threads`;
            
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                     // Jika terjadi 401/403 saat fetch threads, anggap sesi habis
                    forceLogout("Sesi Anda mungkin telah berakhir saat memuat data.");
                    return;
                }
                if (query) {
                    throw new Error(`Search failed. Response status: ${response.status}. (Check A03: SQLi)`);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            const rawThreads = Array.isArray(data.data) ? data.data : [data.data].filter(Boolean);

            const mappedThreads = rawThreads.map(thread => ({
                id: thread.thread_id || thread.id, 
                title: thread.title,
                content: thread.content,
                username: thread.author?.username || thread.author_username || 'Unknown', 
                createdAt: thread.created_at,
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
    }, [debouncedSearchQuery, forceLogout]); // Tambahkan forceLogout

    useEffect(() => {
        fetchThreads(debouncedSearchQuery);
    }, [fetchThreads, debouncedSearchQuery]); 

    const handleLikeClick = (threadId, isLiked) => {
        if (!isLoggedIn()) {
            return toast.warning("Login required to like posts.");
        }
        
        // Placeholder untuk toggle like API call yang akan memicu 401/403
        // Jika API call gagal 401/403, forceLogout akan dipanggil di tempat lain
        setThreads(currentThread => 
            currentThread.map(thread => {
                if (thread.id === threadId) {
                    const newLikesCount = isLiked ? thread.likes - 1 : thread.likes + 1;
                    return { ...thread, likes: newLikesCount, isLiked: !isLiked }; 
                }
                return thread;
            })
        );
        
        console.log(`Toggling like API call for thread ID: ${threadId}`);
    };

    const initials = currentUser?.username ? currentUser.username[0].toUpperCase() : 'U';

    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Header (Sesuai Figma) */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto flex items-center justify-between p-4 gap-4 max-w-4xl">
                    <div className="text-2xl font-bold text-gray-800 cursor-pointer" onClick={() => navigate('/')}>
                        GameKom 
                    </div>
                    <div className="flex-1 max-w-lg relative">
                        <Input 
                            className="border bg-gray-50 rounded-full px-4 py-2 w-full pl-10" 
                            placeholder="Search" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                         <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">🔍</span>
                    </div>
                    
                    {/* AVATAR DENGAN DROPDOWN MENU */}
                    <div className="flex items-center gap-3">
                        {isLoggedIn() ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar className="cursor-pointer size-10 shrink-0">
                                        <AvatarImage src={profilePictureUrl} alt={currentUser.username} />
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => forceLogout()}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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