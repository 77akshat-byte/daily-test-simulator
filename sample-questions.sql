-- Additional Sample Questions
-- You can add these to your database by running:
-- npx wrangler d1 execute test-simulator-db --file=./sample-questions.sql

-- Advanced Mathematics Questions
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, difficulty) VALUES
('What is the integral of 2x?', 'x²', 'x² + C', '2x² + C', 'x', 'B', 'The integral of 2x is x² + C, where C is the constant of integration.', 'Mathematics', 'hard'),
('What is sin(90°)?', '0', '0.5', '1', '√2/2', 'C', 'The sine of 90 degrees equals 1.', 'Mathematics', 'medium'),
('What is the Pythagorean theorem?', 'a + b = c', 'a² + b² = c²', 'a × b = c', 'a² - b² = c²', 'B', 'In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.', 'Mathematics', 'easy');

-- Advanced Science Questions
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, difficulty) VALUES
('What is Newton''s First Law of Motion?', 'F = ma', 'E = mc²', 'Objects at rest stay at rest', 'Action = Reaction', 'C', 'Newton''s First Law states that an object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force.', 'Physics', 'medium'),
('What is the pH of pure water?', '6', '7', '8', '14', 'B', 'Pure water has a neutral pH of 7.', 'Chemistry', 'easy'),
('What is DNA?', 'A protein', 'A carbohydrate', 'A nucleic acid', 'A lipid', 'C', 'DNA (Deoxyribonucleic acid) is a nucleic acid that carries genetic information.', 'Biology', 'medium');

-- Computer Science Questions
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, difficulty) VALUES
('What does CPU stand for?', 'Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Computer Processing Utility', 'A', 'CPU stands for Central Processing Unit, the brain of the computer.', 'Computer Science', 'easy'),
('What is binary code based on?', 'Decimal (0-9)', 'Binary (0-1)', 'Hexadecimal (0-F)', 'Octal (0-7)', 'B', 'Binary code uses only 0s and 1s to represent data.', 'Computer Science', 'easy'),
('What is an algorithm?', 'A type of computer', 'A programming language', 'A step-by-step procedure', 'A computer virus', 'C', 'An algorithm is a step-by-step procedure for solving a problem or completing a task.', 'Computer Science', 'medium');

-- World Geography Questions
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, difficulty) VALUES
('What is the smallest country in the world?', 'Monaco', 'Vatican City', 'San Marino', 'Liechtenstein', 'B', 'Vatican City is the smallest country in the world by both area and population.', 'Geography', 'medium'),
('Which river flows through Egypt?', 'Amazon', 'Nile', 'Ganges', 'Mississippi', 'B', 'The Nile River flows through Egypt and is historically significant to Egyptian civilization.', 'Geography', 'easy'),
('What is the tallest mountain in the world?', 'K2', 'Mount Kilimanjaro', 'Mount Everest', 'Denali', 'C', 'Mount Everest, at 8,849 meters, is the tallest mountain on Earth.', 'Geography', 'easy');

-- History Questions
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, difficulty) VALUES
('When did Christopher Columbus reach the Americas?', '1452', '1492', '1512', '1592', 'B', 'Christopher Columbus reached the Americas in 1492.', 'History', 'medium'),
('Who was the first person to walk on the moon?', 'Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'John Glenn', 'C', 'Neil Armstrong was the first person to walk on the moon on July 20, 1969.', 'History', 'easy'),
('What year did the Berlin Wall fall?', '1987', '1989', '1991', '1993', 'B', 'The Berlin Wall fell on November 9, 1989, marking the end of the Cold War era.', 'History', 'medium');

-- Literature Questions
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, difficulty) VALUES
('Who wrote "To Kill a Mockingbird"?', 'Harper Lee', 'Mark Twain', 'Ernest Hemingway', 'F. Scott Fitzgerald', 'A', 'Harper Lee wrote "To Kill a Mockingbird", published in 1960.', 'Literature', 'medium'),
('What is the opening line of "A Tale of Two Cities"?', '"Call me Ishmael"', '"It was the best of times"', '"Happy families are all alike"', '"It is a truth universally acknowledged"', 'B', 'Charles Dickens'' "A Tale of Two Cities" begins with "It was the best of times, it was the worst of times."', 'Literature', 'hard'),
('Who wrote the Harry Potter series?', 'J.R.R. Tolkien', 'C.S. Lewis', 'J.K. Rowling', 'Roald Dahl', 'C', 'J.K. Rowling is the author of the Harry Potter book series.', 'Literature', 'easy');

-- Economics Questions
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, difficulty) VALUES
('What is GDP?', 'General Development Plan', 'Gross Domestic Product', 'Global Distribution Price', 'Government Debt Payment', 'B', 'GDP stands for Gross Domestic Product, measuring the total economic output of a country.', 'Economics', 'medium'),
('What is inflation?', 'Decrease in prices', 'Increase in prices', 'Stable prices', 'Government spending', 'B', 'Inflation is the general increase in prices and fall in the purchasing value of money.', 'Economics', 'easy'),
('What is supply and demand?', 'A pricing model', 'A tax system', 'A trade agreement', 'A currency type', 'A', 'Supply and demand is an economic model that determines market prices based on availability and desire for goods.', 'Economics', 'medium');

-- Art Questions
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, difficulty) VALUES
('What art movement was Pablo Picasso associated with?', 'Impressionism', 'Cubism', 'Surrealism', 'Realism', 'B', 'Pablo Picasso was a co-founder of the Cubist movement.', 'Art', 'medium'),
('Who painted "The Starry Night"?', 'Claude Monet', 'Vincent van Gogh', 'Pablo Picasso', 'Salvador Dalí', 'B', 'Vincent van Gogh painted "The Starry Night" in 1889.', 'Art', 'easy'),
('What is the Sistine Chapel famous for?', 'Stained glass windows', 'Ceiling frescoes', 'Marble sculptures', 'Tapestries', 'B', 'The Sistine Chapel is famous for its ceiling frescoes painted by Michelangelo.', 'Art', 'medium');

-- Music Questions
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, subject, difficulty) VALUES
('How many strings does a standard guitar have?', '4', '5', '6', '7', 'C', 'A standard guitar has 6 strings.', 'Music', 'easy'),
('Who composed "The Four Seasons"?', 'Mozart', 'Bach', 'Vivaldi', 'Beethoven', 'C', 'Antonio Vivaldi composed "The Four Seasons", a set of violin concertos.', 'Music', 'medium'),
('What does "forte" mean in music?', 'Soft', 'Loud', 'Fast', 'Slow', 'B', 'Forte (f) in music notation means to play loudly.', 'Music', 'easy');
