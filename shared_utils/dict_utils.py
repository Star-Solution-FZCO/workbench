__all__ = ('is_dict_nested_subset',)


def is_dict_nested_subset(
    subset: dict,
    superset: dict,
) -> bool:
    """
    Check if a dictionary is a nested subset of another dictionary.

    This function recursively checks if all key-value pairs in the `subset` dictionary
    are present in the `superset` dictionary. If a value in the `subset` is itself a
    dictionary, the function checks if it is a nested subset of the corresponding value
    in the `superset`.

    :param subset: The dictionary to check as a subset.
    :type subset: dict
    :param superset: The dictionary to check against as the superset.
    :type superset: dict
    :return: True if `subset` is a nested subset of `superset`, False otherwise.
    :rtype: bool

    **Examples**

    .. code-block:: python

        # Example 1: Simple non-nested dictionaries
        subset = {'a': 1, 'b': 2}
        superset = {'a': 1, 'b': 2, 'c': 3}
        result = is_dict_nested_subset(subset, superset)
        print(result)  # Output: True

        # Example 2: Nested dictionaries
        subset = {'a': 1, 'b': {'x': 10}}
        superset = {'a': 1, 'b': {'x': 10, 'y': 20}, 'c': 3}
        result = is_dict_nested_subset(subset, superset)
        print(result)  # Output: True

        # Example 3: Subset not present in superset
        subset = {'a': 1, 'b': {'x': 10, 'z': 30}}
        superset = {'a': 1, 'b': {'x': 10, 'y': 20}, 'c': 3}
        result = is_dict_nested_subset(subset, superset)
        print(result)  # Output: False

    """
    return all(
        key in superset
        and (
            isinstance(superset[key], dict)
            and is_dict_nested_subset(value, superset[key])
            if isinstance(value, dict)
            else superset[key] == value
        )
        for key, value in subset.items()
    )
