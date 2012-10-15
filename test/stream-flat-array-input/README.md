Test handling of a flat array of objects as input:

    $ echo '{"one": 1}{"two": 1}' | json
    [
      {
        "one": 1
      },
      {
        "two": 1
      }
    ]

