"""
Common constants used throughout the codebase.
"""

# Directories
DIR_RESOURCE = "resource"

# Environment variables
ENV_CORS_ORIGIN = "CORS_ORIGIN"
ENV_DOCUMENT_BASE_PATH = "DOCUMENT_BASE_PATH"

# Keys
KEY_PROMPT = "prompt"
KEY_DATA = "data"
KEY_RESPONSE = "response"
KEY_MESSAGES = "messages"
KEY_ROLE = "role"
KEY_CONTENT = "content"
KEY_TRANSPORT = "transport"
KEY_COMMAND = "command"
KEY_ARGS = "args"
KEY_ENV = "env"

# Values
VALUE_USER = "user"
VALUE_TOOL = "tool"
VALUE_AGENT = "agent"
VALUE_DOCUMENT_BASE_PATH_DEFAULT = "/moneypenny-api/resource/document"

# Nodes
NODE_ENTRY_POINT = "entry_point"
NODE_VALIDATE_STATE = "validate_state"
NODE_SET_UP = "set_up"
NODE_PROCESS = "process"
NODE_EXIT_POINT = "exit_point"

# Models
MODEL_GPT_5_MINI = "gpt-5-mini"

# Prompt
PROMPT_APPENDIX_NO_QUESTIONS = ". Use available tools only. Do not invent tools or provide scripts. No additional questions, when in doubt, use defaults."

# Various
ENCODING_UTF8 = "utf-8"
NEWLINE = "\n"
APPLICATION_JSON = "application/json"
APPLICATION_OCTET_STREAM = "application/octet-stream"
TEXT_EVENT_STREAM = "text/event-stream"
TRANSPORT_STDIO = "stdio"
