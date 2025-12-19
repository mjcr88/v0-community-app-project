import type { Meta, StoryObj } from '@storybook/react';
import { PhotoGallerySection } from '@/components/directory/PhotoGallerySection';

const meta = {
    title: 'Molecules/Directory/PhotoGallerySection',
    component: PhotoGallerySection,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Photo gallery section using SharedPhotoGallery. Displays profile photos in a grid with lightbox viewer. Returns null if no photos provided. \n\n**Status**: Profile photo display\n\n**Pages**: `/dashboard/neighbours/[id]`, `/dashboard/families/[id]`',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof PhotoGallerySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPhotos: Story = {
    args: {
        photos: [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
            'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400',
            'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400',
        ],
        residentName: 'Michael Jedamski',
    },
};

export const FewPhotos: Story = {
    args: {
        photos: [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        ],
        residentName: 'Rodriguez Family',
    },
};

export const SinglePhoto: Story = {
    args: {
        photos: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'],
        residentName: 'Smith Family',
    },
};

export const Empty: Story = {
    args: {
        photos: [],
        residentName: 'No Photos',
    },
};

export const ObjectFormat: Story = {
    args: {
        photos: [
            { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' },
            { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400' },
        ],
        residentName: 'Family Photos',
    },
};
