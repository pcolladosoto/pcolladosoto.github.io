from unittest import mock
from unittest.mock import PropertyMock

class Foo:
    @property
    def foo(self):
        return "foo"

    @property
    def faa(self):
        return "faa"

@mock.patch("__main__.Foo.faa", new_callable = PropertyMock)
@mock.patch("__main__.Foo.foo", new_callable = PropertyMock)
def main(x, y):
    x.return_value = "Hello there!"
    y.return_value = "Bye!"
    i_foo = Foo()
    print(f"Foo property -> {i_foo.foo} Faa property -> {i_foo.faa}")

if __name__ == "__main__":
    main()
