create table "public"."user_profiles" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "team_id" uuid,
    "name" text not null,
    "birth_date" text,
    "education" text not null,
    "graduation_university" text,
    "employee_count" integer,
    "organization" text not null,
    "website" text,
    "org_type" text not null,
    "org_size" text not null,
    "city" text not null,
    "work_model" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);

create table "public"."open_question_responses" (
    "id" uuid not null default uuid_generate_v4(),
    "q13" text,
    "q14" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "user_id" uuid,
    "team_id" uuid
);

create table "public"."survey_responses" (
    "id" uuid not null default uuid_generate_v4(),
    "q1" integer,
    "q2" integer,
    "q3" integer,
    "q4" integer,
    "q5" integer,
    "q6" integer,
    "q7" integer,
    "q8" integer,
    "q9" integer,
    "q10" integer,
    "q11" integer,
    "q12" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "user_id" uuid,
    "team_id" uuid
);

create table "public"."teams" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "owner_id" uuid not null,
    "owner_email" text not null,
    "team_size" integer not null default 1,
    "created_at" timestamp with time zone default now()
);

create table "public"."team_members" (
    "id" uuid not null default uuid_generate_v4(),
    "team_id" uuid not null,
    "user_id" uuid,
    "email" text not null,
    "role" text not null,
    "status" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone
);

alter table "public"."user_profiles" drop column if exists "graduation_university";
alter table "public"."user_profiles" alter column "created_at" set default now();
alter table "public"."user_profiles" alter column "created_at" drop not null;
alter table "public"."user_profiles" alter column "employee_count" drop default;
alter table "public"."user_profiles" alter column "id" set default uuid_generate_v4();
alter table "public"."user_profiles" alter column "team_id" drop not null;
alter table "public"."user_profiles" alter column "updated_at" set default now();
alter table "public"."user_profiles" alter column "updated_at" drop not null;
alter table "public"."user_profiles" alter column "user_id" drop not null;

CREATE INDEX idx_open_question_responses_team_id ON public.open_question_responses USING btree (team_id);

CREATE INDEX idx_open_question_responses_user_id ON public.open_question_responses USING btree (user_id);

CREATE INDEX idx_survey_responses_team_id ON public.survey_responses USING btree (team_id);

CREATE INDEX idx_survey_responses_user_id ON public.survey_responses USING btree (user_id);

CREATE INDEX idx_team_members_team_id ON public.team_members USING btree (team_id);

CREATE INDEX idx_user_profiles_team_id ON public.user_profiles USING btree (team_id);

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);

CREATE UNIQUE INDEX open_question_responses_pkey ON public.open_question_responses USING btree (id);

CREATE UNIQUE INDEX open_question_responses_user_team_unique ON public.open_question_responses USING btree (user_id, team_id);

CREATE UNIQUE INDEX survey_responses_pkey ON public.survey_responses USING btree (id);

CREATE UNIQUE INDEX survey_responses_user_team_unique ON public.survey_responses USING btree (user_id, team_id);

CREATE INDEX team_members_email_idx ON public.team_members USING btree (email);

CREATE UNIQUE INDEX team_members_pkey ON public.team_members USING btree (id);

CREATE INDEX team_members_team_id_idx ON public.team_members USING btree (team_id);

CREATE INDEX team_members_user_id_idx ON public.team_members USING btree (user_id);

CREATE INDEX teams_name_owner_email_idx ON public.teams USING btree (name, owner_email);

CREATE INDEX teams_owner_id_idx ON public.teams USING btree (owner_id);

CREATE UNIQUE INDEX teams_pkey ON public.teams USING btree (id);

CREATE UNIQUE INDEX unique_team_member_email ON public.team_members USING btree (team_id, email);

CREATE UNIQUE INDEX user_profiles_user_team_unique ON public.user_profiles USING btree (user_id, team_id);

alter table "public"."open_question_responses" add constraint "open_question_responses_pkey" PRIMARY KEY using index "open_question_responses_pkey";

alter table "public"."survey_responses" add constraint "survey_responses_pkey" PRIMARY KEY using index "survey_responses_pkey";

alter table "public"."team_members" add constraint "team_members_pkey" PRIMARY KEY using index "team_members_pkey";

alter table "public"."teams" add constraint "teams_pkey" PRIMARY KEY using index "teams_pkey";

alter table "public"."open_question_responses" add constraint "open_question_responses_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE not valid;

alter table "public"."open_question_responses" validate constraint "open_question_responses_team_id_fkey";

alter table "public"."open_question_responses" add constraint "open_question_responses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."open_question_responses" validate constraint "open_question_responses_user_id_fkey";

alter table "public"."open_question_responses" add constraint "open_question_responses_user_team_unique" UNIQUE using index "open_question_responses_user_team_unique";

alter table "public"."survey_responses" add constraint "survey_responses_q10_check" CHECK (((q10 >= 1) AND (q10 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q10_check";

alter table "public"."survey_responses" add constraint "survey_responses_q11_check" CHECK (((q11 >= 1) AND (q11 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q11_check";

alter table "public"."survey_responses" add constraint "survey_responses_q12_check" CHECK (((q12 >= 1) AND (q12 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q12_check";

alter table "public"."survey_responses" add constraint "survey_responses_q1_check" CHECK (((q1 >= 1) AND (q1 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q1_check";

alter table "public"."survey_responses" add constraint "survey_responses_q2_check" CHECK (((q2 >= 1) AND (q2 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q2_check";

alter table "public"."survey_responses" add constraint "survey_responses_q3_check" CHECK (((q3 >= 1) AND (q3 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q3_check";

alter table "public"."survey_responses" add constraint "survey_responses_q4_check" CHECK (((q4 >= 1) AND (q4 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q4_check";

alter table "public"."survey_responses" add constraint "survey_responses_q5_check" CHECK (((q5 >= 1) AND (q5 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q5_check";

alter table "public"."survey_responses" add constraint "survey_responses_q6_check" CHECK (((q6 >= 1) AND (q6 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q6_check";

alter table "public"."survey_responses" add constraint "survey_responses_q7_check" CHECK (((q7 >= 1) AND (q7 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q7_check";

alter table "public"."survey_responses" add constraint "survey_responses_q8_check" CHECK (((q8 >= 1) AND (q8 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q8_check";

alter table "public"."survey_responses" add constraint "survey_responses_q9_check" CHECK (((q9 >= 1) AND (q9 <= 5))) not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_q9_check";

alter table "public"."survey_responses" add constraint "survey_responses_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_team_id_fkey";

alter table "public"."survey_responses" add constraint "survey_responses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."survey_responses" validate constraint "survey_responses_user_id_fkey";

alter table "public"."survey_responses" add constraint "survey_responses_user_team_unique" UNIQUE using index "survey_responses_user_team_unique";

alter table "public"."team_members" add constraint "team_members_role_check" CHECK ((role = ANY (ARRAY['leader'::text, 'member'::text]))) not valid;

alter table "public"."team_members" validate constraint "team_members_role_check";

alter table "public"."team_members" add constraint "team_members_status_check" CHECK ((status = ANY (ARRAY['invited'::text, 'answered'::text, 'pending_survey'::text]))) not valid;

alter table "public"."team_members" validate constraint "team_members_status_check";

alter table "public"."team_members" add constraint "team_members_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE not valid;

alter table "public"."team_members" validate constraint "team_members_team_id_fkey";

alter table "public"."team_members" add constraint "team_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."team_members" validate constraint "team_members_user_id_fkey";

alter table "public"."team_members" add constraint "unique_team_member_email" UNIQUE using index "unique_team_member_email";

alter table "public"."teams" add constraint "teams_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."teams" validate constraint "teams_owner_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_team_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_user_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_user_team_unique" UNIQUE using index "user_profiles_user_team_unique";

set check_function_bodies = off;

create or replace view "public"."team_survey_responses" as  SELECT tm.id AS team_member_id,
    tm.team_id,
    tm.user_id,
    tm.email,
    tm.role,
    tm.status,
    sr.q1,
    sr.q2,
    sr.q3,
    sr.q4,
    sr.q5,
    sr.q6,
    sr.q7,
    sr.q8,
    sr.q9,
    sr.q10,
    sr.q11,
    sr.q12,
    sr.created_at AS response_created_at,
    sr.updated_at AS response_updated_at
   FROM (team_members tm
     LEFT JOIN survey_responses sr ON (((sr.user_id = tm.user_id) AND (sr.team_id = tm.team_id))));


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."open_question_responses" to "anon";

grant insert on table "public"."open_question_responses" to "anon";

grant references on table "public"."open_question_responses" to "anon";

grant select on table "public"."open_question_responses" to "anon";

grant trigger on table "public"."open_question_responses" to "anon";

grant truncate on table "public"."open_question_responses" to "anon";

grant update on table "public"."open_question_responses" to "anon";

grant delete on table "public"."open_question_responses" to "authenticated";

grant insert on table "public"."open_question_responses" to "authenticated";

grant references on table "public"."open_question_responses" to "authenticated";

grant select on table "public"."open_question_responses" to "authenticated";

grant trigger on table "public"."open_question_responses" to "authenticated";

grant truncate on table "public"."open_question_responses" to "authenticated";

grant update on table "public"."open_question_responses" to "authenticated";

grant delete on table "public"."open_question_responses" to "service_role";

grant insert on table "public"."open_question_responses" to "service_role";

grant references on table "public"."open_question_responses" to "service_role";

grant select on table "public"."open_question_responses" to "service_role";

grant trigger on table "public"."open_question_responses" to "service_role";

grant truncate on table "public"."open_question_responses" to "service_role";

grant update on table "public"."open_question_responses" to "service_role";

grant delete on table "public"."survey_responses" to "anon";

grant insert on table "public"."survey_responses" to "anon";

grant references on table "public"."survey_responses" to "anon";

grant select on table "public"."survey_responses" to "anon";

grant trigger on table "public"."survey_responses" to "anon";

grant truncate on table "public"."survey_responses" to "anon";

grant update on table "public"."survey_responses" to "anon";

grant delete on table "public"."survey_responses" to "authenticated";

grant insert on table "public"."survey_responses" to "authenticated";

grant references on table "public"."survey_responses" to "authenticated";

grant select on table "public"."survey_responses" to "authenticated";

grant trigger on table "public"."survey_responses" to "authenticated";

grant truncate on table "public"."survey_responses" to "authenticated";

grant update on table "public"."survey_responses" to "authenticated";

grant delete on table "public"."survey_responses" to "service_role";

grant insert on table "public"."survey_responses" to "service_role";

grant references on table "public"."survey_responses" to "service_role";

grant select on table "public"."survey_responses" to "service_role";

grant trigger on table "public"."survey_responses" to "service_role";

grant truncate on table "public"."survey_responses" to "service_role";

grant update on table "public"."survey_responses" to "service_role";

grant delete on table "public"."team_members" to "anon";

grant insert on table "public"."team_members" to "anon";

grant references on table "public"."team_members" to "anon";

grant select on table "public"."team_members" to "anon";

grant trigger on table "public"."team_members" to "anon";

grant truncate on table "public"."team_members" to "anon";

grant update on table "public"."team_members" to "anon";

grant delete on table "public"."team_members" to "authenticated";

grant insert on table "public"."team_members" to "authenticated";

grant references on table "public"."team_members" to "authenticated";

grant select on table "public"."team_members" to "authenticated";

grant trigger on table "public"."team_members" to "authenticated";

grant truncate on table "public"."team_members" to "authenticated";

grant update on table "public"."team_members" to "authenticated";

grant delete on table "public"."team_members" to "service_role";

grant insert on table "public"."team_members" to "service_role";

grant references on table "public"."team_members" to "service_role";

grant select on table "public"."team_members" to "service_role";

grant trigger on table "public"."team_members" to "service_role";

grant truncate on table "public"."team_members" to "service_role";

grant update on table "public"."team_members" to "service_role";

grant delete on table "public"."teams" to "anon";

grant insert on table "public"."teams" to "anon";

grant references on table "public"."teams" to "anon";

grant select on table "public"."teams" to "anon";

grant trigger on table "public"."teams" to "anon";

grant truncate on table "public"."teams" to "anon";

grant update on table "public"."teams" to "anon";

grant delete on table "public"."teams" to "authenticated";

grant insert on table "public"."teams" to "authenticated";

grant references on table "public"."teams" to "authenticated";

grant select on table "public"."teams" to "authenticated";

grant trigger on table "public"."teams" to "authenticated";

grant truncate on table "public"."teams" to "authenticated";

grant update on table "public"."teams" to "authenticated";

grant delete on table "public"."teams" to "service_role";

grant insert on table "public"."teams" to "service_role";

grant references on table "public"."teams" to "service_role";

grant select on table "public"."teams" to "service_role";

grant trigger on table "public"."teams" to "service_role";

grant truncate on table "public"."teams" to "service_role";

grant update on table "public"."teams" to "service_role";

CREATE TRIGGER update_open_question_responses_updated_at BEFORE UPDATE ON public.open_question_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at BEFORE UPDATE ON public.survey_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


