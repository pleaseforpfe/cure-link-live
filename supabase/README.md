# Supabase schema notes

## Timeline (`/timeline`)

The timeline page currently renders cards from `src/data/speakers.ts`. The table
`public.timeline_cards` (migration in `supabase/migrations/20260424160000_create_timeline_cards.sql`)
is intended to hold the same data so the timeline becomes dynamic.

Field mapping:

- `full_name` -> speaker name (e.g. "Dr. Marcus Chen")
- `specialty` + `organization` -> headline (e.g. "Cardiology · Stanford")
- `talk_title` -> talk title (e.g. "AI-Driven Cardiac Diagnostics")
- `starts_at`/`ends_at` -> used for the displayed range and countdown/status
- `is_live` + `stream_url` -> show `Watch Live →` button for the single live session
- `photo_url` -> speaker image
- `description` -> expanded text
- `links` -> expanded buttons `[{label,url}]`
- `gallery` -> expanded image grid `["url1","url2",...]`

## Partners (`/partners`)

The partners page currently renders 3 hardcoded groups (`clubs`, `media`, `sponsors`)
in `src/pages/Partners.tsx`. The table `public.partners` (migration in
`supabase/migrations/20260424163000_create_partners.sql`) is intended to hold
the same data.

Field mapping:

- `category` -> section id (`clubs` | `media` | `sponsors`)
- `name` -> partner name
- `description` -> the small subtitle under the name
- `image_url` -> card image
- Order by `created_at` ascending to match the insertion order used by the frontend.

## Clubs (`/clubs`)

The clubs page currently renders cards from `src/pages/Clubs.tsx` (`clubsData`).
The table `public.clubs` (migration in `supabase/migrations/20260424164000_create_clubs.sql`)
is intended to hold the same data.

Field mapping:

- `club_name` -> card title (e.g. `Cardio Club`)
- `workshop_title` -> card subtitle / modal header
- `description` -> card body text
- `gallery` -> modal images `["url1","url2",...]`

Ordering:

- Order by `created_at` ascending to match the insertion order used by the frontend.

## Organizers (`/organizers`)

The organizers page currently renders facilities/groups from `src/pages/Organizers.tsx`
(`organizerGroups`). The tables:

- `public.organizer_groups`
- `public.organizer_people`

in `supabase/migrations/20260424171000_create_organizers.sql` are intended to hold the
same data.

Field mapping:

- group `slug` -> group id (e.g. `faculty`, `team`)
- group `title` -> facility name
- group `description` -> facility description
- group `website_url` -> facility website
- group `image_url` -> facility image
- person `full_name` -> name (e.g. "Dr. Lina Haddad")
- person `role` -> role (e.g. "Academic Chair")
- person `bio` -> description text
- person `photo_url` -> photo
- person `linkedin_url` -> optional LinkedIn

Ordering:

- Groups: order by `created_at` ascending.
- People within a group: order by `created_at` ascending.

## Portfolio (`/gallery`)

The portfolio page currently renders items from `src/pages/gallery.tsx` (`items`).
The table `public.portfolio_items` (migration in
`supabase/migrations/20260424173000_create_portfolio_items.sql`) is intended to hold
the same data.

Field mapping:

- `title` -> item title
- `category` -> label (e.g. `Poster`, `Badge`, `UI`)
- `image_url` -> image shown in the grid / zoom modal

Ordering:

- Order by `created_at` ascending to match the insertion order used by the frontend.

## Login (`/login`)

The login page is `src/pages/Admin/AdminLogin.tsx`. The table `public.admin_users`
(migration in `supabase/migrations/20260424173500_create_admin_users.sql`) is intended
to store admin credentials.

Fields:

- `full_name`
- `role` (always `admin`)
- `email` (unique)
- `password_hash` (store a hash, not plaintext)
