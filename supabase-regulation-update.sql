-- SQL migration to add regulation column and allow admin CRUD operations

-- 1. Alter table to add regulation column with '2024' as default
alter table syllabus_courses add column if not exists regulation text default '2024' not null;

-- 2. Drop policies if they exist to prevent duplicate creation errors
drop policy if exists "Allow public insert access" on syllabus_courses;
drop policy if exists "Allow public delete access" on syllabus_courses;

-- 3. Create insert/delete policies
create policy "Allow public insert access" on syllabus_courses
  for insert with check (true);

create policy "Allow public delete access" on syllabus_courses
  for delete using (true);

