--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6 (Debian 17.6-2.pgdg13+1)
-- Dumped by pg_dump version 17.6 (Debian 17.6-2.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: venues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE DATABASE "VenueDb";
       
\connect VenueDb
       
CREATE TABLE public.venues (
                               id integer NOT NULL,
                               name character varying(150) NOT NULL,
                               address character varying(200) NOT NULL,
                               city character varying(50) NOT NULL,
                               country character varying(50) NOT NULL,
                               latitude numeric(8,5),
                               longitude numeric(9,5),
                               capacity integer,
                               CONSTRAINT venues_capacity_check CHECK ((capacity > 0))
);


ALTER TABLE public.venues OWNER TO postgres;

--
-- Name: venues_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.venues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.venues_id_seq OWNER TO postgres;

--
-- Name: venues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.venues_id_seq OWNED BY public.venues.id;


--
-- Name: venues id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venues ALTER COLUMN id SET DEFAULT nextval('public.venues_id_seq'::regclass);


--
-- Name: venues venues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venues
    ADD CONSTRAINT venues_pkey PRIMARY KEY (id);

-- Simple data seed

INSERT INTO public.venues (name, address, city, country, latitude, longitude, capacity) VALUES
                                                                                            ('National Opera of Ukraine', 'Volodymyrska St, 50', 'Kyiv', 'Ukraine', 50.44682, 30.51287, 1304),
                                                                                            ('Olimpiyskiy National Sports Complex', 'Velyka Vasylkivska St, 55', 'Kyiv', 'Ukraine', 50.43333, 30.52167, 70050),
                                                                                            ('Palace of Sports', 'Sportyvna Square, 1', 'Kyiv', 'Ukraine', 50.43750, 30.52222, 10000),
                                                                                            ('Freedom Hall', 'Kyrylivska St, 134', 'Kyiv', 'Ukraine', 50.48670, 30.47650, 1000),
                                                                                            ('Caribbean Club', 'Symona Petliury St, 4', 'Kyiv', 'Ukraine', 50.44520, 30.49680, 500),
                                                                                            ('Lviv Theatre of Opera and Ballet', 'Svobody Ave, 28', 'Lviv', 'Ukraine', 49.84400, 24.02622, 1100),
                                                                                            ('Arena Lviv', 'Stryiska St, 199', 'Lviv', 'Ukraine', 49.77167, 24.02944, 34915),
                                                                                            ('Malevich Concert Arena', 'Viacheslava Chornovola Ave, 2', 'Lviv', 'Ukraine', 49.85120, 24.02670, 1400),
                                                                                            ('!FESTrepublic', 'Staroznesenska St, 24-26', 'Lviv', 'Ukraine', 49.85430, 24.05680, 2500),
                                                                                            ('Odesa National Academic Opera', 'Chaikovs''koho Ln, 1', 'Odesa', 'Ukraine', 46.48530, 30.74100, 1636),
                                                                                            ('Chornomorets Stadium', 'Marazliivska St, 1/20', 'Odesa', 'Ukraine', 46.48056, 30.74639, 34164),
                                                                                            ('Ibiza Beach Club', 'Arcadia Beach', 'Odesa', 'Ukraine', 46.42580, 30.77050, 3000),
                                                                                            ('Kharkiv National Opera', 'Sumska St, 25', 'Kharkiv', 'Ukraine', 49.99920, 36.23350, 1500),
                                                                                            ('Metalist Stadium', 'Plehanivska St, 65', 'Kharkiv', 'Ukraine', 49.98083, 36.26139, 40003),
                                                                                            ('Radmir Expo Hall', 'Akademika Pavlova St, 271', 'Kharkiv', 'Ukraine', 50.01350, 36.31980, 2000),
                                                                                            ('Dnipro-Arena', 'Khersonska St, 7', 'Dnipro', 'Ukraine', 48.46000, 35.03222, 31003),
                                                                                            ('Menorah Center', 'Sholom-Aleichema St, 4/26', 'Dnipro', 'Ukraine', 48.46450, 35.05380, 1200),
                                                                                            ('Meteor Palace of Sports', 'O. Makarova St, 27a', 'Dnipro', 'Ukraine', 48.43500, 35.00670, 5500),
                                                                                            ('Slavutych Arena', 'Valeriia Lobanovskoho St, 21', 'Zaporizhzhia', 'Ukraine', 47.85778, 35.09389, 11883),
                                                                                            ('Kozak Palace', 'Peremohy St, 70B', 'Zaporizhzhia', 'Ukraine', 47.83450, 35.13200, 3000),
                                                                                            ('Vinnytsia Regional Philharmony', 'Khmelnytske Hwy, 7', 'Vinnytsia', 'Ukraine', 49.23250, 28.46280, 600),
                                                                                            ('Officers House', 'Peremohy Square, 1', 'Vinnytsia', 'Ukraine', 49.23840, 28.49000, 950),
                                                                                            ('Rukh Stadium', 'Chornovola St, 128', 'Ivano-Frankivsk', 'Ukraine', 48.91080, 24.69780, 15000),
                                                                                            ('Panorama Plaza', 'Pivnichnyi Blvd, 2a', 'Ivano-Frankivsk', 'Ukraine', 48.92400, 24.70850, 450),
                                                                                            ('Drama Theatre', 'Teatralna Square, 1', 'Chernivtsi', 'Ukraine', 48.29150, 25.93280, 800),
                                                                                            ('Summer Theatre', 'Sadhora Park', 'Chernivtsi', 'Ukraine', 48.29800, 25.94000, 1200),
                                                                                            ('Avanhard Stadium', 'Zamkova St, 34', 'Lutsk', 'Ukraine', 50.74830, 25.32830, 12080),
                                                                                            ('Adrenalin City', 'Karbysheva St, 1', 'Lutsk', 'Ukraine', 50.77250, 25.38120, 2000),
                                                                                            ('Ternopil City Stadium', 'Stepana Bandery Ave, 15', 'Ternopil', 'Ukraine', 49.55390, 25.60440, 15150),
                                                                                            ('Berezil Palace of Culture', 'Myru St, 6', 'Ternopil', 'Ukraine', 49.54450, 25.57800, 1100),
                                                                                            ('Veres Place', 'Soborna St, 14', 'Rivne', 'Ukraine', 50.61900, 26.25100, 300),
                                                                                            ('Avanhard Stadium Rivne', 'Zamkova St, 34', 'Rivne', 'Ukraine', 50.61500, 26.25500, 4500),
                                                                                            ('Yunist Palace of Sports', 'Peremohy St, 66', 'Zaporizhzhia', 'Ukraine', 47.83200, 35.13000, 3500),
                                                                                            ('Poltava Vorskla Stadium', 'Maidan Nezalezhnosti, 16', 'Poltava', 'Ukraine', 49.59330, 34.55140, 24795),
                                                                                            ('Villa Krokodila', 'Pershotravnevyi Ave, 20B', 'Poltava', 'Ukraine', 49.58900, 34.55500, 400),
                                                                                            ('Central City Stadium', 'Tsentralnyi Ave, 18', 'Mykolaiv', 'Ukraine', 46.96580, 31.96500, 15600),
                                                                                            ('Yunist Palace', 'Teatralna St, 1', 'Mykolaiv', 'Ukraine', 46.97000, 31.99500, 800),
                                                                                            ('Fabrika Mall Cinema', 'Zalaeherseh St, 18', 'Kherson', 'Ukraine', 46.66600, 32.63500, 400),
                                                                                            ('Jubilee Stadium', 'Gagarina St, 11', 'Sumy', 'Ukraine', 50.90390, 34.79330, 25830),
                                                                                            ('Manezh Sports Complex', 'Prokofieva St, 38', 'Sumy', 'Ukraine', 50.89500, 34.81000, 1500),
                                                                                            ('Cherkasy Arena', 'Smilianska St, 78', 'Cherkasy', 'Ukraine', 49.43100, 32.05400, 10321),
                                                                                            ('Friendship of Peoples Palace', 'Shevchenka Blvd, 249', 'Cherkasy', 'Ukraine', 49.44400, 32.06000, 1000),
                                                                                            ('Star Stadium', 'Gagarina St, 28', 'Kropyvnytskyi', 'Ukraine', 48.51100, 32.26100, 13667),
                                                                                            ('Zhytomyr Drama Theatre', 'Soborna Square, 6', 'Zhytomyr', 'Ukraine', 50.25300, 28.65800, 850),
                                                                                            ('Tsentralnyi Stadion', 'Festyvalna St, 5', 'Zhytomyr', 'Ukraine', 50.24500, 28.67000, 5928),
                                                                                            ('Uzhhorod Amphitheatre', 'Orlyna St, 13', 'Uzhhorod', 'Ukraine', 48.62300, 22.29600, 1500),
                                                                                            ('Avangard Stadium Uzhhorod', 'Ivana Franka St, 1', 'Uzhhorod', 'Ukraine', 48.62000, 22.28500, 12000),
                                                                                            ('Podillya Stadium', 'Proskurivska St, 81', 'Khmelnytskyi', 'Ukraine', 49.42600, 26.98500, 10500),
                                                                                            ('Bilochka Park Stage', 'Parkova St, 12', 'Khmelnytskyi', 'Ukraine', 49.42000, 26.98000, 300),
                                                                                            ('Victory Concert Hall', 'Sumska St, 88', 'Kharkiv', 'Ukraine', 50.00500, 36.23600, 1100);

--
-- PostgreSQL database dump complete
--
