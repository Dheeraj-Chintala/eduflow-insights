-- Insert modules for Python course
INSERT INTO course_modules (course_id, title, description, sort_order) VALUES
('b5a6a209-7417-416f-8a7e-87632eb30de5', 'Python Basics', 'Learn the fundamentals of Python programming including syntax, variables, and data types.', 1),
('b5a6a209-7417-416f-8a7e-87632eb30de5', 'Control Structures', 'Master control flow with operators, conditionals, and loops.', 2),
('b5a6a209-7417-416f-8a7e-87632eb30de5', 'Functions and Modules', 'Create reusable code with functions and organize with modules.', 3),
('b5a6a209-7417-416f-8a7e-87632eb30de5', 'Data Structures', 'Work with Python''s built-in data structures: lists, tuples, dictionaries, and sets.', 4),
('b5a6a209-7417-416f-8a7e-87632eb30de5', 'File Handling', 'Read and write files, handle exceptions, and build a mini project.', 5);

-- Insert lessons for Module 1: Python Basics
INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Introduction to Python', 'text', 
'# Introduction to Python

Python is a high-level, interpreted programming language known for its simplicity and readability.

## Why Learn Python?
- Easy to learn syntax
- Versatile: web development, data science, AI, automation
- Large community and extensive libraries
- Great for beginners and professionals alike

## Your First Python Code
```python
print("Hello, World!")
```

## Key Features
1. **Interpreted**: No compilation needed
2. **Dynamic typing**: No need to declare variable types
3. **Object-oriented**: Supports OOP concepts
4. **Extensive libraries**: NumPy, Pandas, Django, Flask', 15, 1
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Python Basics';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Installing Python and IDE Setup', 'text',
'# Installing Python and IDE Setup

## Step 1: Download Python
Visit [python.org](https://python.org) and download the latest version.

## Step 2: Install Python
- Windows: Run the installer, check "Add Python to PATH"
- Mac: Use Homebrew: `brew install python`
- Linux: `sudo apt install python3`

## Step 3: Choose an IDE
Popular options:
- **VS Code**: Free, lightweight, extensible
- **PyCharm**: Full-featured Python IDE
- **Jupyter Notebook**: Great for data science

## Verify Installation
```bash
python --version
# or
python3 --version
```', 20, 2
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Python Basics';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Variables and Data Types', 'text',
'# Variables and Data Types

## Creating Variables
```python
name = "Alice"
age = 25
height = 5.6
is_student = True
```

## Data Types
| Type | Example | Description |
|------|---------|-------------|
| str | "Hello" | Text strings |
| int | 42 | Whole numbers |
| float | 3.14 | Decimal numbers |
| bool | True/False | Boolean values |
| list | [1, 2, 3] | Ordered collection |
| dict | {"key": "value"} | Key-value pairs |

## Type Checking
```python
print(type(name))  # <class ''str''>
print(type(age))   # <class ''int''>
```', 25, 3
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Python Basics';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Input and Output Functions', 'text',
'# Input and Output Functions

## Output with print()
```python
print("Hello, World!")
print("Name:", name, "Age:", age)
print(f"Hello, {name}! You are {age} years old.")
```

## Input with input()
```python
user_name = input("Enter your name: ")
user_age = int(input("Enter your age: "))
print(f"Welcome, {user_name}!")
```

## Formatting Output
```python
# f-strings (recommended)
print(f"Value: {value:.2f}")

# format() method
print("Value: {:.2f}".format(value))
```', 20, 4
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Python Basics';

-- Module 2: Control Structures
INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Operators in Python', 'text',
'# Operators in Python

## Arithmetic Operators
```python
a + b   # Addition
a - b   # Subtraction
a * b   # Multiplication
a / b   # Division
a // b  # Floor division
a % b   # Modulo
a ** b  # Exponentiation
```

## Comparison Operators
```python
a == b  # Equal
a != b  # Not equal
a > b   # Greater than
a < b   # Less than
a >= b  # Greater or equal
a <= b  # Less or equal
```

## Logical Operators
```python
and, or, not
```', 20, 1
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Control Structures';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Conditional Statements', 'text',
'# Conditional Statements

## if Statement
```python
if age >= 18:
    print("You are an adult")
```

## if-elif-else
```python
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
```

## Ternary Operator
```python
status = "adult" if age >= 18 else "minor"
```', 25, 2
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Control Structures';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Loops (for and while)', 'text',
'# Loops in Python

## for Loop
```python
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4

for item in ["apple", "banana", "cherry"]:
    print(item)
```

## while Loop
```python
count = 0
while count < 5:
    print(count)
    count += 1
```

## Iterating with enumerate()
```python
fruits = ["apple", "banana", "cherry"]
for index, fruit in enumerate(fruits):
    print(f"{index}: {fruit}")
```', 30, 3
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Control Structures';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Break and Continue', 'text',
'# Break and Continue

## break Statement
Exits the loop entirely:
```python
for i in range(10):
    if i == 5:
        break
    print(i)  # Prints 0-4
```

## continue Statement
Skips to next iteration:
```python
for i in range(5):
    if i == 2:
        continue
    print(i)  # Prints 0, 1, 3, 4
```

## Using with while
```python
while True:
    user_input = input("Enter ''quit'' to exit: ")
    if user_input == "quit":
        break
    print(f"You entered: {user_input}")
```', 15, 4
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Control Structures';

-- Module 3: Functions and Modules
INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Creating Functions', 'text',
'# Creating Functions

## Basic Function
```python
def greet():
    print("Hello!")

greet()  # Call the function
```

## Function with Return
```python
def add(a, b):
    return a + b

result = add(3, 5)  # result = 8
```

## Docstrings
```python
def calculate_area(radius):
    """Calculate the area of a circle.
    
    Args:
        radius: The radius of the circle
    Returns:
        The area of the circle
    """
    return 3.14159 * radius ** 2
```', 25, 1
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Functions and Modules';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Function Arguments', 'text',
'# Function Arguments

## Positional Arguments
```python
def greet(name, message):
    print(f"{message}, {name}!")

greet("Alice", "Hello")
```

## Default Arguments
```python
def greet(name, message="Hello"):
    print(f"{message}, {name}!")

greet("Bob")  # Uses default message
```

## Keyword Arguments
```python
greet(message="Hi", name="Charlie")
```

## *args and **kwargs
```python
def sum_all(*args):
    return sum(args)

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")
```', 25, 2
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Functions and Modules';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Python Modules', 'text',
'# Python Modules

## What are Modules?
Modules are Python files containing functions, classes, and variables.

## Creating a Module
```python
# mymodule.py
def greet(name):
    return f"Hello, {name}!"

PI = 3.14159
```

## Using a Module
```python
import mymodule

print(mymodule.greet("Alice"))
print(mymodule.PI)
```

## Import Variations
```python
from mymodule import greet
from mymodule import *
import mymodule as mm
```', 20, 3
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Functions and Modules';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Importing Packages', 'text',
'# Importing Packages

## Standard Library
```python
import math
import datetime
import random
import os

print(math.sqrt(16))  # 4.0
print(random.randint(1, 10))
print(datetime.datetime.now())
```

## Installing External Packages
```bash
pip install requests
pip install pandas numpy
```

## Using External Packages
```python
import requests

response = requests.get("https://api.example.com/data")
print(response.json())
```', 20, 4
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Functions and Modules';

-- Module 4: Data Structures
INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Lists', 'text',
'# Lists

## Creating Lists
```python
fruits = ["apple", "banana", "cherry"]
numbers = [1, 2, 3, 4, 5]
mixed = [1, "hello", True, 3.14]
```

## List Operations
```python
fruits.append("orange")     # Add item
fruits.insert(1, "mango")   # Insert at index
fruits.remove("banana")     # Remove item
popped = fruits.pop()       # Remove last
fruits.sort()               # Sort list
```

## List Slicing
```python
fruits[0]      # First item
fruits[-1]     # Last item
fruits[1:3]    # Slice
fruits[::-1]   # Reverse
```

## List Comprehension
```python
squares = [x**2 for x in range(10)]
```', 30, 1
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Data Structures';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Tuples', 'text',
'# Tuples

## Creating Tuples
```python
coordinates = (10, 20)
colors = ("red", "green", "blue")
single = (42,)  # Single item tuple
```

## Tuple Properties
- **Immutable**: Cannot be changed after creation
- **Ordered**: Items have a fixed position
- **Faster**: More efficient than lists

## Tuple Operations
```python
x, y = coordinates  # Unpacking
print(colors[0])    # Accessing
print(len(colors))  # Length

# Tuple methods
colors.count("red")
colors.index("green")
```

## When to Use Tuples
- Fixed data that shouldn''t change
- Dictionary keys
- Function return values
```python
def get_dimensions():
    return (1920, 1080)
```', 20, 2
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Data Structures';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Dictionaries', 'text',
'# Dictionaries

## Creating Dictionaries
```python
student = {
    "name": "Alice",
    "age": 20,
    "courses": ["Math", "Physics"]
}
```

## Accessing Values
```python
print(student["name"])
print(student.get("grade", "N/A"))  # With default
```

## Modifying Dictionaries
```python
student["age"] = 21           # Update
student["email"] = "a@b.com"  # Add
del student["courses"]        # Delete
```

## Iterating
```python
for key in student:
    print(key, student[key])

for key, value in student.items():
    print(f"{key}: {value}")
```', 25, 3
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Data Structures';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Sets', 'text',
'# Sets

## Creating Sets
```python
fruits = {"apple", "banana", "cherry"}
numbers = set([1, 2, 3, 2, 1])  # {1, 2, 3}
```

## Set Properties
- **Unordered**: No fixed position
- **Unique**: No duplicate values
- **Mutable**: Can add/remove items

## Set Operations
```python
a = {1, 2, 3}
b = {3, 4, 5}

a.union(b)         # {1, 2, 3, 4, 5}
a.intersection(b)  # {3}
a.difference(b)    # {1, 2}
a.symmetric_difference(b)  # {1, 2, 4, 5}
```

## Set Methods
```python
fruits.add("orange")
fruits.remove("banana")
fruits.discard("mango")  # No error if not found
```', 20, 4
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'Data Structures';

-- Module 5: File Handling
INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Reading Files', 'text',
'# Reading Files

## Opening and Reading
```python
# Read entire file
with open("file.txt", "r") as file:
    content = file.read()
    print(content)

# Read line by line
with open("file.txt", "r") as file:
    for line in file:
        print(line.strip())

# Read all lines into list
with open("file.txt", "r") as file:
    lines = file.readlines()
```

## File Modes
| Mode | Description |
|------|-------------|
| "r" | Read (default) |
| "w" | Write (overwrites) |
| "a" | Append |
| "r+" | Read and write |', 25, 1
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'File Handling';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Writing Files', 'text',
'# Writing Files

## Writing to a File
```python
with open("output.txt", "w") as file:
    file.write("Hello, World!\n")
    file.write("This is a new line.\n")
```

## Appending to a File
```python
with open("output.txt", "a") as file:
    file.write("Appended text\n")
```

## Writing Multiple Lines
```python
lines = ["Line 1\n", "Line 2\n", "Line 3\n"]
with open("output.txt", "w") as file:
    file.writelines(lines)
```

## Best Practice: Use with Statement
The `with` statement automatically closes the file, even if an error occurs.', 20, 2
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'File Handling';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Exception Handling', 'text',
'# Exception Handling

## try-except Block
```python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero!")
```

## Multiple Exceptions
```python
try:
    value = int(input("Enter a number: "))
    result = 10 / value
except ValueError:
    print("Invalid input!")
except ZeroDivisionError:
    print("Cannot divide by zero!")
```

## finally Block
```python
try:
    file = open("data.txt", "r")
    content = file.read()
except FileNotFoundError:
    print("File not found!")
finally:
    print("Cleanup complete")
```

## Raising Exceptions
```python
if age < 0:
    raise ValueError("Age cannot be negative")
```', 30, 3
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'File Handling';

INSERT INTO lessons (module_id, title, content_type, content_text, duration, sort_order)
SELECT m.id, 'Mini Project: Student Data Manager', 'text',
'# Mini Project: Student Data Manager

Build a simple student data manager that saves and loads data from a file.

## Project Code
```python
import json

def save_students(students, filename="students.json"):
    """Save student data to a JSON file."""
    with open(filename, "w") as file:
        json.dump(students, file, indent=2)
    print(f"Saved {len(students)} students.")

def load_students(filename="students.json"):
    """Load student data from a JSON file."""
    try:
        with open(filename, "r") as file:
            return json.load(file)
    except FileNotFoundError:
        return []

def add_student(students):
    """Add a new student."""
    name = input("Enter student name: ")
    age = int(input("Enter student age: "))
    grade = input("Enter student grade: ")
    students.append({"name": name, "age": age, "grade": grade})
    print(f"Added {name}!")

# Main program
students = load_students()
add_student(students)
save_students(students)
```

🎉 **Congratulations!** You have completed the Python Programming Course!', 45, 4
FROM course_modules m WHERE m.course_id = 'b5a6a209-7417-416f-8a7e-87632eb30de5' AND m.title = 'File Handling';