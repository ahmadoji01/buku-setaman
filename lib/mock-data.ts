import type { User, Story, Module } from "./types"

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@bukusetaman.com",
    role: "admin",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    name: "Ibu Sari",
    email: "sari@teacher.com",
    role: "teacher",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "3",
    name: "Pak Budi",
    email: "budi@teacher.com",
    role: "teacher",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
]

export const mockStories: Story[] = [
  {
    id: "1",
    title: "Kebun Sayur Kecil",
    content: {
      indonesian: [
        {
          pageNumber: 1,
          text: "Di sebuah desa kecil, hiduplah seorang anak bernama Andi.",
          illustration: "/placeholder-x7vnw.png",
        },
        {
          pageNumber: 2,
          text: "Andi sangat suka berkebun dan memiliki kebun sayur kecil di belakang rumahnya.",
          illustration: "/placeholder-x7vnw.png",
        },
        {
          pageNumber: 3,
          text: "Setiap pagi, Andi menyiram tanaman-tanamannya dengan penuh kasih sayang.",
          illustration: "/placeholder-x7vnw.png",
        },
      ],
      sundanese: [
        {
          pageNumber: 1,
          text: "Di hiji kampung leutik, cicing budak nu ngaranna Andi.",
          illustration: "/placeholder-x7vnw.png",
        },
        {
          pageNumber: 2,
          text: "Andi resep pisan kebon jeung boga kebon sayur leutik di tukangeun imahna.",
          illustration: "/placeholder-x7vnw.png",
        },
        {
          pageNumber: 3,
          text: "Unggal isuk, Andi nyiram tutuwuhan-tutuwuhanna kalawan pinuh asih.",
          illustration: "/placeholder-x7vnw.png",
        },
      ],
      english: [
        {
          pageNumber: 1,
          text: "In a small village, there lived a child named Andi.",
          illustration: "/placeholder-x7vnw.png",
        },
        {
          pageNumber: 2,
          text: "Andi loved gardening and had a small vegetable garden behind his house.",
          illustration: "/placeholder-x7vnw.png",
        },
        {
          pageNumber: 3,
          text: "Every morning, Andi watered his plants with great care and love.",
          illustration: "/placeholder-x7vnw.png",
        },
      ],
    },
    authorId: "2",
    authorName: "Ibu Sari",
    illustrations: ["/placeholder-x7vnw.png"],
    audioFiles: {
      indonesian: "/audio/kebun-sayur-id.mp3",
      sundanese: "/audio/kebun-sayur-su.mp3",
      english: "/audio/kebun-sayur-en.mp3",
    },
    isPublished: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "2",
    title: "Petualangan di Hutan",
    content: {
      indonesian: [
        {
          pageNumber: 1,
          text: "Sinta dan teman-temannya pergi berpetualang ke hutan.",
          illustration: "/children-forest-adventure-fruits.jpg",
        },
        {
          pageNumber: 2,
          text: "Mereka mencari buah-buahan liar yang bisa dimakan.",
          illustration: "/children-forest-adventure-fruits.jpg",
        },
      ],
      english: [
        {
          pageNumber: 1,
          text: "Sinta and her friends went on an adventure to the forest.",
          illustration: "/children-forest-adventure-fruits.jpg",
        },
        {
          pageNumber: 2,
          text: "They looked for wild fruits that could be eaten.",
          illustration: "/children-forest-adventure-fruits.jpg",
        },
      ],
    },
    authorId: "3",
    authorName: "Pak Budi",
    illustrations: ["/children-forest-adventure-fruits.jpg"],
    audioFiles: {
      indonesian: "/audio/petualangan-hutan-id.mp3",
      english: "/audio/petualangan-hutan-en.mp3",
    },
    isPublished: true,
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-05"),
  },
]

export const mockModules: Module[] = [
  {
    id: "1",
    title: "Cara Membuat Cerita yang Menarik",
    description: "Panduan lengkap untuk guru dalam membuat cerita yang menarik untuk anak-anak",
    content: "Modul ini akan mengajarkan teknik-teknik dasar dalam membuat cerita yang menarik...",
    type: "blog",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "2",
    title: "Penggunaan AI dalam Pendidikan",
    description: "Memahami cara menggunakan AI untuk meningkatkan kualitas pembelajaran",
    content: "Artificial Intelligence telah menjadi bagian penting dalam dunia pendidikan...",
    type: "ppt",
    fileUrl: "/modules/ai-education.pptx",
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
  },
]

// Helper functions for mock data operations
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find((user) => user.id === id)
}

export const getStoriesByAuthor = (authorId: string): Story[] => {
  return mockStories.filter((story) => story.authorId === authorId)
}

export const getPublishedStories = (): Story[] => {
  return mockStories.filter((story) => story.isPublished)
}

export const getCurrentUser = (): User => {
  // For demo purposes, return admin user to test admin functions
  return mockUsers[0] // Admin User
}
