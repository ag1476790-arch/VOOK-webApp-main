import { Heart } from "lucide-react";
import Image from "next/image";
import trend1 from "@/assets/trend-1.jpg";
import trend2 from "@/assets/trend-2.jpg";
import trend3 from "@/assets/trend-3.jpg";

const trendingPosts = [
  {
    id: 1,
    title: "#Hackathon2024 Winners Announced",
    image: trend1,
    likes: "2.4K",
  },
  {
    id: 2,
    title: "New AI Club Launch Event",
    image: trend2,
    likes: "1.8K",
  },
  {
    id: 3,
    title: "Campus Photography Contest",
    image: trend3,
    likes: "956",
  },
];

const TrendingPosts = () => {
  return (
    <section className="px-4 pb-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Trending</h2>
        <button className="text-sm text-primary hover:underline">See All</button>
      </div>

      <div className="flex flex-col gap-3">
        {trendingPosts.map((post, index) => (
          <article
            key={post.id}
            className="group flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-2 transition-all duration-300 hover:border-primary/50 hover:bg-card-hover"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="80px"
              />
            </div>

            <div className="flex flex-col justify-center gap-1">
              <h3 className="font-display text-sm font-semibold leading-tight text-foreground line-clamp-2">
                {post.title}
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="text-primary font-medium flex items-center gap-0.5">
                  <Heart className="h-3 w-3 fill-current" />
                  {post.likes}
                </span>
                <span>Likes</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TrendingPosts;
