import type { Meta, StoryObj } from '@storybook/react';
import { Marquee } from './marquee';

const ReviewCard = ({
    img,
    name,
    username,
    body,
}: {
    img: string;
    name: string;
    username: string;
    body: string;
}) => {
    return (
        <figure
            className="relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4 border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05] dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
        >
            <div className="flex flex-row items-center gap-2">
                <img className="rounded-full" width="32" height="32" alt="" src={img} />
                <div className="flex flex-col">
                    <figcaption className="text-sm font-medium dark:text-white">
                        {name}
                    </figcaption>
                    <p className="text-xs font-medium dark:text-white/40">{username}</p>
                </div>
            </div>
            <blockquote className="mt-2 text-sm">{body}</blockquote>
        </figure>
    );
};

const reviews = [
    {
        name: "Jack",
        username: "@jack",
        body: "I've never seen anything like this before. It's amazing. I love it.",
        img: "https://avatar.vercel.sh/jack",
    },
    {
        name: "Jill",
        username: "@jill",
        body: "I don't know what to say. I'm speechless. This is amazing.",
        img: "https://avatar.vercel.sh/jill",
    },
];

const meta = {
    title: 'Atoms/Visuals/Marquee',
    component: Marquee,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Infinite scrolling marquee component. \n\n**Status**: Used in `components/onboarding/cards/event-marquee`, which is used in `/t/[slug]/onboarding/tour`.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => (
        <div className="relative flex h-[200px] w-[400px] flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
            <Marquee {...args}>
                {reviews.map((review) => (
                    <ReviewCard key={review.username} {...review} />
                ))}
            </Marquee>
        </div>
    ),
    args: {
        pauseOnHover: true,
        repeat: 4,
    },
};
