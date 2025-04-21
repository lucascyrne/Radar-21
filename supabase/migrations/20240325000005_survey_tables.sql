-- 2. Tabelas da pesquisa
-- 2.1 Dados demográficos (primeiro passo)
CREATE TABLE "public"."demographic_data" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid,
    "team_id" uuid,
    "name" text NOT NULL,
    "birth_date" text,
    "education" text NOT NULL,
    "graduation_university" text,
    "graduation_date" date,
    "employee_count" integer,
    "organization" text NOT NULL,
    "website" text,
    "org_type" text NOT NULL,
    "org_size" text NOT NULL,
    "city" text NOT NULL,
    "work_model" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "demographic_data_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "demographic_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT "demographic_data_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT "demographic_data_user_team_unique" UNIQUE (user_id, team_id)
);

-- 2.2 Respostas do questionário principal
CREATE TABLE "public"."survey_responses" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid,
    "team_id" uuid,
    "q1" integer CHECK ((q1 >= 1) AND (q1 <= 5)),
    "q2" integer CHECK ((q2 >= 1) AND (q2 <= 5)),
    "q3" integer CHECK ((q3 >= 1) AND (q3 <= 5)),
    "q4" integer CHECK ((q4 >= 1) AND (q4 <= 5)),
    "q5" integer CHECK ((q5 >= 1) AND (q5 <= 5)),
    "q6" integer CHECK ((q6 >= 1) AND (q6 <= 5)),
    "q7" integer CHECK ((q7 >= 1) AND (q7 <= 5)),
    "q8" integer CHECK ((q8 >= 1) AND (q8 <= 5)),
    "q9" integer CHECK ((q9 >= 1) AND (q9 <= 5)),
    "q10" integer CHECK ((q10 >= 1) AND (q10 <= 5)),
    "q11" integer CHECK ((q11 >= 1) AND (q11 <= 5)),
    "q12" integer CHECK ((q12 >= 1) AND (q12 <= 5)),
    "is_complete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "survey_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT "survey_responses_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT "survey_responses_user_team_unique" UNIQUE (user_id, team_id)
);

-- 2.3 Respostas das questões abertas
CREATE TABLE "public"."open_question_responses" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid,
    "team_id" uuid,
    "q13" text,
    "q14" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "open_question_responses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "open_question_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT "open_question_responses_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT "open_question_responses_user_team_unique" UNIQUE (user_id, team_id)
);

-- Índices para demographic_data
CREATE INDEX idx_demographic_data_user_id ON public.demographic_data USING btree (user_id);
CREATE INDEX idx_demographic_data_team_id ON public.demographic_data USING btree (team_id);

-- Índices para survey_responses
CREATE INDEX idx_survey_responses_user_id ON public.survey_responses USING btree (user_id);
CREATE INDEX idx_survey_responses_team_id ON public.survey_responses USING btree (team_id);

-- Índices para open_question_responses
CREATE INDEX idx_open_question_responses_user_id ON public.open_question_responses USING btree (user_id);
CREATE INDEX idx_open_question_responses_team_id ON public.open_question_responses USING btree (team_id);

-- Triggers para atualização de timestamps
CREATE TRIGGER update_demographic_data_updated_at 
    BEFORE UPDATE ON public.demographic_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at 
    BEFORE UPDATE ON public.survey_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_open_question_responses_updated_at 
    BEFORE UPDATE ON public.open_question_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 