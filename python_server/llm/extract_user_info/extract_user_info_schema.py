from pydantic import BaseModel, Field


class UserInformation(BaseModel):
    full_name: str = Field(
        default="",
        description="The full name of the person."
    )

    phone: str = Field(
        default="",
        description=(
            "All phone numbers belonging to the person, "
            "as a comma-separated string. Empty string if not found."
        )
    )

    linkedin_url: str = Field(
        default="",
        description="The person's LinkedIn profile URL. Empty string if not found."
    )

    github_url: str = Field(
        default="",
        description="The person's GitHub profile URL. Empty string if not found."
    )

    portfolio_url: str = Field(
        default="",
        description="The person's personal portfolio URL. Empty string if not found."
    )

    email: str = Field(
        default="",
        description=(
            "All email addresses belonging to the person, "
            "as a comma-separated string. Empty string if not found."
        )
    )