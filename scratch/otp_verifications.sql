-- Create OTP Verifications Table
create table otp_verifications (
  id uuid default uuid_generate_v4() primary key,
  phone text not null,
  code text not null,
  type text default 'register',
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS (optional, depends on your setup)
-- alter table otp_verifications enable row level security;
