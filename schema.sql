
-- D1 Database Schema for Daily Test Simulator

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK(correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  subject TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
  video_url TEXT,
  video_type TEXT CHECK(video_type IN ('youtube', 'stream')) DEFAULT 'youtube',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User test attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  test_date DATE NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  score INTEGER,
  total_questions INTEGER DEFAULT 25,
  UNIQUE(user_id, test_date)
);

-- User answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  user_answer TEXT CHECK(user_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES test_attempts(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Daily question sets (to track which questions are shown each day)
CREATE TABLE IF NOT EXISTS daily_question_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_date DATE NOT NULL UNIQUE,
  question_ids TEXT NOT NULL, -- JSON array of question IDs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample questions
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, difficulty) VALUES
('What is the capital of France?', 'London', 'Berlin', 'Paris', 'Madrid', 'C', 'Paris is the capital and largest city of France.', 'Geography', 'easy'),
('What is 15 × 7?', '95', '105', '115', '125', 'B', '15 multiplied by 7 equals 105.', 'Mathematics', 'easy'),
('Who wrote "Romeo and Juliet"?', 'Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain', 'B', 'William Shakespeare wrote this famous tragedy.', 'Literature', 'easy'),
('What is the chemical symbol for water?', 'H2O', 'CO2', 'O2', 'NaCl', 'A', 'Water is composed of two hydrogen atoms and one oxygen atom.', 'Science', 'easy'),
('What is the largest planet in our solar system?', 'Mars', 'Saturn', 'Jupiter', 'Neptune', 'C', 'Jupiter is the largest planet in our solar system.', 'Science', 'easy'),
('What is the square root of 144?', '11', '12', '13', '14', 'B', 'The square root of 144 is 12.', 'Mathematics', 'easy'),
('In what year did World War II end?', '1943', '1944', '1945', '1946', 'C', 'World War II ended in 1945.', 'History', 'medium'),
('What is the speed of light in vacuum?', '300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s', 'A', 'Light travels at approximately 300,000 kilometers per second in vacuum.', 'Physics', 'medium'),
('Who painted the Mona Lisa?', 'Pablo Picasso', 'Vincent van Gogh', 'Leonardo da Vinci', 'Michelangelo', 'C', 'Leonardo da Vinci painted the Mona Lisa in the early 16th century.', 'Art', 'easy'),
('What is the powerhouse of the cell?', 'Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus', 'C', 'Mitochondria are known as the powerhouse of the cell because they produce ATP.', 'Biology', 'easy'),
('What is the result of 2³ + 3²?', '13', '17', '19', '21', 'B', '2³ = 8 and 3² = 9, so 8 + 9 = 17.', 'Mathematics', 'medium'),
('Which continent is the Sahara Desert located on?', 'Asia', 'Africa', 'Australia', 'South America', 'B', 'The Sahara Desert is located in Africa.', 'Geography', 'easy'),
('What is the boiling point of water at sea level?', '90°C', '100°C', '110°C', '120°C', 'B', 'Water boils at 100°C (212°F) at sea level.', 'Science', 'easy'),
('Who was the first president of the United States?', 'Thomas Jefferson', 'George Washington', 'John Adams', 'Benjamin Franklin', 'B', 'George Washington was the first president of the United States.', 'History', 'easy'),
('What is the smallest prime number?', '0', '1', '2', '3', 'C', '2 is the smallest prime number.', 'Mathematics', 'easy'),
('Which gas do plants absorb from the atmosphere?', 'Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen', 'C', 'Plants absorb carbon dioxide during photosynthesis.', 'Biology', 'easy'),
('What is the capital of Japan?', 'Seoul', 'Beijing', 'Tokyo', 'Bangkok', 'C', 'Tokyo is the capital of Japan.', 'Geography', 'easy'),
('What is the value of π (pi) to two decimal places?', '3.12', '3.14', '3.16', '3.18', 'B', 'Pi is approximately 3.14159, which rounds to 3.14.', 'Mathematics', 'easy'),
('Who discovered penicillin?', 'Marie Curie', 'Alexander Fleming', 'Louis Pasteur', 'Isaac Newton', 'B', 'Alexander Fleming discovered penicillin in 1928.', 'Science', 'medium'),
('What is the longest river in the world?', 'Amazon', 'Nile', 'Yangtze', 'Mississippi', 'B', 'The Nile River is traditionally considered the longest river in the world.', 'Geography', 'medium'),
('What is the derivative of x²?', 'x', '2x', '2', 'x²/2', 'B', 'The derivative of x² is 2x.', 'Mathematics', 'medium'),
('Which element has the atomic number 1?', 'Helium', 'Hydrogen', 'Lithium', 'Carbon', 'B', 'Hydrogen has the atomic number 1.', 'Chemistry', 'easy'),
('In which year did the Titanic sink?', '1910', '1912', '1914', '1916', 'B', 'The Titanic sank on April 15, 1912.', 'History', 'easy'),
('What is the formula for the area of a circle?', 'πr', 'πr²', '2πr', 'πd', 'B', 'The area of a circle is π times the radius squared (πr²).', 'Mathematics', 'easy'),
('Which planet is known as the Red Planet?', 'Venus', 'Mars', 'Mercury', 'Jupiter', 'B', 'Mars is known as the Red Planet due to its reddish appearance.', 'Science', 'easy'),
('What is the main language spoken in Brazil?', 'Spanish', 'Portuguese', 'French', 'English', 'B', 'Portuguese is the official language of Brazil.', 'Geography', 'easy'),
('What is the sum of angles in a triangle?', '90°', '180°', '270°', '360°', 'B', 'The sum of all angles in a triangle is always 180°.', 'Mathematics', 'easy'),
('Who wrote "1984"?', 'Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells', 'B', 'George Orwell wrote the dystopian novel "1984".', 'Literature', 'easy'),
('What is the chemical symbol for gold?', 'Go', 'Gd', 'Au', 'Ag', 'C', 'Au is the chemical symbol for gold (from Latin: aurum).', 'Chemistry', 'medium'),
('How many continents are there?', '5', '6', '7', '8', 'C', 'There are 7 continents: Africa, Antarctica, Asia, Europe, North America, Oceania, and South America.', 'Geography', 'easy'),
('What is 25% of 200?', '25', '50', '75', '100', 'B', '25% of 200 is 50 (200 × 0.25 = 50).', 'Mathematics', 'easy'),
('Which organ pumps blood throughout the human body?', 'Liver', 'Kidney', 'Heart', 'Lungs', 'C', 'The heart pumps blood throughout the circulatory system.', 'Biology', 'easy'),
('What is the freezing point of water?', '-10°C', '0°C', '10°C', '32°C', 'B', 'Water freezes at 0°C (32°F) at standard atmospheric pressure.', 'Science', 'easy'),
('Who developed the theory of relativity?', 'Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Stephen Hawking', 'B', 'Albert Einstein developed the theory of relativity.', 'Physics', 'medium'),
('What is the largest ocean on Earth?', 'Atlantic', 'Indian', 'Arctic', 'Pacific', 'D', 'The Pacific Ocean is the largest ocean on Earth.', 'Geography', 'easy'),
('What is 12²?', '124', '134', '144', '154', 'C', '12 squared equals 144.', 'Mathematics', 'easy'),
('Which vitamin is produced when skin is exposed to sunlight?', 'Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D', 'D', 'Vitamin D is produced when skin is exposed to sunlight.', 'Biology', 'easy'),
('What is the capital of Italy?', 'Venice', 'Milan', 'Rome', 'Florence', 'C', 'Rome is the capital of Italy.', 'Geography', 'easy'),
('What is the next prime number after 7?', '8', '9', '10', '11', 'D', '11 is the next prime number after 7.', 'Mathematics', 'easy'),
('Which gas is most abundant in Earth''s atmosphere?', 'Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen', 'C', 'Nitrogen makes up about 78% of Earth''s atmosphere.', 'Science', 'easy'),
('In which country were the Olympic Games originated?', 'Italy', 'Greece', 'Egypt', 'Turkey', 'B', 'The Olympic Games originated in ancient Greece.', 'History', 'easy');

