import asyncio
from akinator import (
    CantGoBackAnyFurther,
    InvalidAnswer,
    AsyncAkinator,
    Answer,
    Theme,
)

async def test() -> None:
    aki = AsyncAkinator(
        child_mode=False,
        theme=Theme.from_str('characters'),
    )
    
    first_question = await aki.start_game()
    answer = input(f'{first_question}: ')

    while aki.progression <= 80:
        if answer == 'back':
            try:
                await aki.back()
                print('went back 1 question')
            except CantGoBackAnyFurther:
                print('cannot go back any further!')
        else:
            try:
                answer = Answer.from_str(answer)
            except InvalidAnswer:
                print('Invalid answer')
            else:
                await aki.answer(answer)

        answer = input(f'{aki.question}: ')

    first_guess = await aki.win()

    if first_guess:
        print('name:', first_guess.name)
        print('desc:', first_guess.description)
        print('image:', first_guess.absolute_picture_path)

if __name__ == '__main__':
    asyncio.run(test())
