import sys
import json


def parse_env_input(input_lines):
    env_data = {}
    for line in input_lines:
        line = line.strip()
        if line and not line.startswith('#'):
            key, value = line.split('=', 1)
            env_data[key] = value.strip('"')
    return env_data


def main():
    input_lines = sys.stdin.readlines()
    env_data = parse_env_input(input_lines)

    # JSON形式で出力
    print(json.dumps(env_data, indent=4))


if __name__ == "__main__":
    main()
