/**
 * Unit tests for collection name pluralization
 */

import { describe, expect, it } from "vitest";
import { pluralize, singularize, toCollectionName } from "../pluralize";

describe("Pluralize Utilities", () => {
  describe("pluralize", () => {
    describe("regular plurals", () => {
      it("should add -s to regular nouns", () => {
        expect(pluralize("user")).toBe("users");
        expect(pluralize("project")).toBe("projects");
        expect(pluralize("post")).toBe("posts");
        expect(pluralize("comment")).toBe("comments");
        expect(pluralize("article")).toBe("articles");
      });

      it("should preserve capitalization", () => {
        expect(pluralize("User")).toBe("Users");
        expect(pluralize("Project")).toBe("Projects");
        expect(pluralize("Post")).toBe("Posts");
      });
    });

    describe("words ending in -s, -ss, -sh, -ch, -x, -z", () => {
      it("should add -es", () => {
        expect(pluralize("bus")).toBe("buses");
        expect(pluralize("class")).toBe("classes");
        expect(pluralize("dish")).toBe("dishes");
        expect(pluralize("church")).toBe("churches");
        expect(pluralize("box")).toBe("boxes");
        expect(pluralize("buzz")).toBe("buzzes");
      });

      it("should preserve capitalization", () => {
        expect(pluralize("Bus")).toBe("Buses");
        expect(pluralize("Class")).toBe("Classes");
      });
    });

    describe("words ending in consonant + y", () => {
      it("should change y to ies", () => {
        expect(pluralize("category")).toBe("categories");
        expect(pluralize("company")).toBe("companies");
        expect(pluralize("city")).toBe("cities");
        expect(pluralize("country")).toBe("countries");
        expect(pluralize("story")).toBe("stories");
        expect(pluralize("party")).toBe("parties");
        expect(pluralize("family")).toBe("families");
        expect(pluralize("activity")).toBe("activities");
        expect(pluralize("priority")).toBe("priorities");
      });

      it("should preserve capitalization", () => {
        expect(pluralize("Category")).toBe("Categories");
        expect(pluralize("Company")).toBe("Companies");
      });
    });

    describe("words ending in vowel + y", () => {
      it("should add -s", () => {
        expect(pluralize("day")).toBe("days");
        expect(pluralize("key")).toBe("keys");
        expect(pluralize("boy")).toBe("boys");
        expect(pluralize("toy")).toBe("toys");
      });
    });

    describe("words ending in consonant + o", () => {
      it("should add -es", () => {
        expect(pluralize("hero")).toBe("heroes");
        expect(pluralize("potato")).toBe("potatoes");
        expect(pluralize("tomato")).toBe("tomatoes");
      });
    });

    describe("words ending in -f or -fe", () => {
      it("should change to -ves", () => {
        expect(pluralize("life")).toBe("lives");
        expect(pluralize("wife")).toBe("wives");
        expect(pluralize("knife")).toBe("knives");
        expect(pluralize("leaf")).toBe("leaves");
        expect(pluralize("shelf")).toBe("shelves");
        expect(pluralize("half")).toBe("halves");
      });

      it("should preserve capitalization", () => {
        expect(pluralize("Life")).toBe("Lives");
        expect(pluralize("Knife")).toBe("Knives");
      });
    });

    describe("irregular plurals", () => {
      it("should handle person -> people", () => {
        expect(pluralize("person")).toBe("people");
        expect(pluralize("Person")).toBe("People");
      });

      it("should handle child -> children", () => {
        expect(pluralize("child")).toBe("children");
        expect(pluralize("Child")).toBe("Children");
      });

      it("should handle man -> men", () => {
        expect(pluralize("man")).toBe("men");
        expect(pluralize("Man")).toBe("Men");
      });

      it("should handle woman -> women", () => {
        expect(pluralize("woman")).toBe("women");
        expect(pluralize("Woman")).toBe("Women");
      });

      it("should handle tooth -> teeth", () => {
        expect(pluralize("tooth")).toBe("teeth");
        expect(pluralize("Tooth")).toBe("Teeth");
      });

      it("should handle foot -> feet", () => {
        expect(pluralize("foot")).toBe("feet");
        expect(pluralize("Foot")).toBe("Feet");
      });

      it("should handle mouse -> mice", () => {
        expect(pluralize("mouse")).toBe("mice");
        expect(pluralize("Mouse")).toBe("Mice");
      });

      it("should handle goose -> geese", () => {
        expect(pluralize("goose")).toBe("geese");
        expect(pluralize("Goose")).toBe("Geese");
      });
    });

    describe("words ending in -is", () => {
      it("should change to -es", () => {
        expect(pluralize("analysis")).toBe("analyses");
        expect(pluralize("basis")).toBe("bases");
        expect(pluralize("crisis")).toBe("crises");
        expect(pluralize("thesis")).toBe("theses");
      });

      it("should preserve capitalization", () => {
        expect(pluralize("Analysis")).toBe("Analyses");
        expect(pluralize("Crisis")).toBe("Crises");
      });
    });

    describe("words ending in -us", () => {
      it("should change to -i", () => {
        expect(pluralize("cactus")).toBe("cacti");
        expect(pluralize("focus")).toBe("foci");
        expect(pluralize("fungus")).toBe("fungi");
        expect(pluralize("nucleus")).toBe("nuclei");
        expect(pluralize("radius")).toBe("radii");
      });

      it("should preserve capitalization", () => {
        expect(pluralize("Cactus")).toBe("Cacti");
        expect(pluralize("Focus")).toBe("Foci");
      });
    });

    describe("words ending in -on", () => {
      it("should change to -a", () => {
        expect(pluralize("phenomenon")).toBe("phenomena");
        expect(pluralize("criterion")).toBe("criteria");
      });

      it("should preserve capitalization", () => {
        expect(pluralize("Phenomenon")).toBe("Phenomena");
        expect(pluralize("Criterion")).toBe("Criteria");
      });
    });

    describe("words ending in -um", () => {
      it("should change to -a", () => {
        expect(pluralize("datum")).toBe("data");
        expect(pluralize("medium")).toBe("media");
        expect(pluralize("curriculum")).toBe("curricula");
      });

      it("should preserve capitalization", () => {
        expect(pluralize("Datum")).toBe("Data");
        expect(pluralize("Medium")).toBe("Media");
      });
    });

    describe("unchanged plurals", () => {
      it("should keep same form", () => {
        expect(pluralize("sheep")).toBe("sheep");
        expect(pluralize("deer")).toBe("deer");
        expect(pluralize("fish")).toBe("fish");
        expect(pluralize("species")).toBe("species");
        expect(pluralize("series")).toBe("series");
      });

      it("should preserve capitalization", () => {
        expect(pluralize("Sheep")).toBe("Sheep");
        expect(pluralize("Deer")).toBe("Deer");
      });
    });

    describe("already plural words", () => {
      it("should return as-is for words ending in s", () => {
        expect(pluralize("users")).toBe("users");
        expect(pluralize("projects")).toBe("projects");
      });
    });
  });

  describe("toCollectionName", () => {
    it("should be an alias for pluralize", () => {
      expect(toCollectionName("User")).toBe("Users");
      expect(toCollectionName("Project")).toBe("Projects");
      expect(toCollectionName("Category")).toBe("Categories");
      expect(toCollectionName("Person")).toBe("People");
    });
  });

  describe("singularize", () => {
    it("should reverse regular plurals", () => {
      expect(singularize("users")).toBe("user");
      expect(singularize("projects")).toBe("project");
      expect(singularize("posts")).toBe("post");
    });

    it("should reverse -ies to -y", () => {
      expect(singularize("categories")).toBe("category");
      expect(singularize("companies")).toBe("company");
      expect(singularize("cities")).toBe("city");
    });

    it("should reverse -ves to -fe", () => {
      expect(singularize("lives")).toBe("life");
      expect(singularize("knives")).toBe("knife");
    });

    it("should reverse -es endings", () => {
      expect(singularize("buses")).toBe("bus");
      expect(singularize("classes")).toBe("class");
      expect(singularize("dishes")).toBe("dish");
    });

    it("should handle irregular plurals", () => {
      expect(singularize("people")).toBe("person");
      expect(singularize("children")).toBe("child");
      expect(singularize("men")).toBe("man");
      expect(singularize("women")).toBe("woman");
    });

    it("should preserve capitalization", () => {
      expect(singularize("Users")).toBe("User");
      expect(singularize("Categories")).toBe("Category");
    });

    it("should return as-is for non-plural words", () => {
      expect(singularize("user")).toBe("user");
      expect(singularize("project")).toBe("project");
    });
  });
});
