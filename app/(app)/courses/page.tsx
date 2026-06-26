import Link from "next/link";
import { BookOpen, ChevronRight, Layers, FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { CreateCourseForm } from "@/components/create-course-form";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { materials: true, decks: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Organize your courses, then let AI summarize them and build flashcards."
        action={<CreateCourseForm />}
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={28} />}
          title="No courses yet"
          description="Create your first course to start adding materials."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="group p-4 transition-colors hover:border-accent/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-medium">{course.title}</h2>
                    {course.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                        {course.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-muted transition-transform group-hover:translate-x-0.5"
                  />
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <FileText size={13} /> {course._count.materials} materials
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers size={13} /> {course._count.decks} decks
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
