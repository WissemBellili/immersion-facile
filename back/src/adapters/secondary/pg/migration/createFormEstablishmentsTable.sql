CREATE TABLE public.form_establishments (
    id uuid PRIMARY KEY,
    created_at timestamp without time zone DEFAULT now(),
    siret char(14) NOT NULL,
    business_name varchar(255) NOT NULL,
    business_address varchar(255) NOT NULL,
    naf jsonb,
    professions jsonb NOT NULL,
    business_contacts jsonb NOT NULL,
    preferred_contact_methods jsonb NOT NULL
);
