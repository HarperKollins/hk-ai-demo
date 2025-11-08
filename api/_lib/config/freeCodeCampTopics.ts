// src/config/freeCodeCampTopics.ts

export const freeCodeCampTopics = [
  {
    slug: "html_basics",
    title: "HTML Full Course - Beginner to Pro",
    youtubeVideoId: "dD2EISBDjWM", // freeCodeCamp HTML course
    courseUrl: "https://www.freecodecamp.org/learn/2022/responsive-web-design/"
  },
  {
    slug: "python_intro",
    title: "Python for Beginners - Full Course",
    youtubeVideoId: "rfscVS0vtbw",
    courseUrl: "https://www.freecodecamp.org/learn/scientific-computing-with-python/"
  }
  // We can add more topics here later
];

// Helper function to find a topic from our list
export const getTopicBySlug = (slug: string) => {
  return freeCodeCampTopics.find(topic => topic.slug === slug);
};