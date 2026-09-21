import requests
from bs4 import BeautifulSoup


def decode_secret_message(url):
    response = requests.get(url)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    points = []

    # Read the table
    for row in soup.find_all("tr")[1:]:
        cells = row.find_all("td")

        if len(cells) != 3:
            continue

        x = int(cells[0].get_text(strip=True))
        char = cells[1].get_text()
        y = int(cells[2].get_text(strip=True))

        points.append((x, y, char))

    if not points:
        return

    # Determine grid size
    max_x = max(x for x, y, char in points)
    max_y = max(y for x, y, char in points)

    # Create empty grid
    grid = [[" " for _ in range(max_x + 1)]
            for _ in range(max_y + 1)]

    # Place characters
    for x, y, char in points:
        grid[y][x] = char

    # Print the grid
    for row in grid:
        print("".join(row))


# Example:
decode_secret_message(
    "https://docs.google.com/document/d/e/2PACX-1vTM0mshQe8YaRXi6gEPKkIsC6UpFJSMAk4mQjLm_u1gmHdVTaeh7nBNFBRIu0sTZ-snGwZM4DBCT/pub"
)