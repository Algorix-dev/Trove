"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookOpen } from "lucide-react"
import Link from "next/link"
import { type Book } from "@/types"

interface BookGridProps {
    books: Book[]
}

export function BookGrid({ books }: BookGridProps) {
    if (books.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No books found. Upload one to get started!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books.map((book) => {
                const isGradient = book.cover_url?.startsWith('gradient:')
                const gradientStyle = isGradient ? book.cover_url.replace('gradient:', '') : null

                return (
                    <Link href={`/dashboard/reader/${book.id}`} key={book.id}>
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                            <CardContent className="p-4">
                                <div className="aspect-[2/3] rounded-md mb-4 flex items-center justify-center relative overflow-hidden shadow-sm">
                                    {isGradient ? (
                                        <div
                                            className="w-full h-full flex flex-col items-center justify-center p-4 text-white"
                                            style={{ background: gradientStyle || '' }}
                                        >
                                            <div className="text-center space-y-2">
                                                <BookOpen className="h-10 w-10 mx-auto opacity-90" />
                                                <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                                                    {book.format}
                                                </p>
                                            </div>
                                            <div className="absolute inset-0 bg-black/20"></div>
                                        </div>
                                    ) : book.cover_url ? (
                                        <img
                                            src={book.cover_url}
                                            alt={book.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-muted-foreground/50 w-full h-full bg-secondary/30">
                                            <BookOpen className="h-12 w-12 mb-2" />
                                            <span className="text-xs uppercase font-bold tracking-wider opacity-70">
                                                {book.format}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">
                                        Read Now
                                    </div>
                                </div>
                                <h3 className="font-semibold truncate" title={book.title}>{book.title}</h3>
                                <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 block">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>0%</span>
                                </div>
                                <Progress value={0} className="h-1" />
                            </CardFooter>
                        </Card>
                    </Link>
                )
            })}
        </div>
    )
}
