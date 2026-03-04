import { TypeManager } from '../../core/services/helper/TypeManager.js';

describe('TypeManager', () => {

  describe('isBool', () => {
    it('doit retourner true pour les booléens natifs', () => {
      expect(TypeManager.isBool(true)).toEqual(true);
      expect(TypeManager.isBool(false)).toEqual(true);
    });

    it('doit retourner true pour les chaînes "true" et "false"', () => {
      expect(TypeManager.isBool("true")).toEqual(true);
      expect(TypeManager.isBool("false")).toEqual(true);
    });

    it('doit retourner false pour les autres types', () => {
      expect(TypeManager.isBool("pasUnBool")).toEqual(false);
      expect(TypeManager.isBool(123)).toEqual(false);
    });
  });

  describe('strToBool', () => {
    it('doit convertir "true" en true', () => {
      expect(TypeManager.strToBool("true")).toEqual(true);
    });

    it('doit retourner false pour "false" ou n importe quoi d autre', () => {
      expect(TypeManager.strToBool("false")).toEqual(false);
      expect(TypeManager.strToBool("bonjour")).toEqual(false);
    });

    it('doit retourner la valeur si c est déjà un booléen', () => {
      expect(TypeManager.strToBool(true)).toEqual(true);
      expect(TypeManager.strToBool(false)).toEqual(false);
    });
  });

  describe('isDefined', () => {
    it('doit retourner false pour null, undefined ou NaN', () => {
      expect(TypeManager.isDefined(null)).toEqual(false);
      expect(TypeManager.isDefined(undefined)).toEqual(false);
      expect(TypeManager.isDefined(NaN)).toEqual(false);
    });

    it('doit retourner true pour les valeurs définies', () => {
      expect(TypeManager.isDefined(0)).toEqual(true);
      expect(TypeManager.isDefined("")).toEqual(true);
      expect(TypeManager.isDefined([])).toEqual(true);
    });
  });

  describe('getType', () => {
    it('doit identifier les nombres', () => {
      expect(TypeManager.getType(1)).toEqual("number");
      expect(TypeManager.getType(0)).toEqual("number");
      expect(TypeManager.getType("42")).toEqual("number");
    });

    it('doit identifier les tableaux', () => {
      expect(TypeManager.getType([1, 2])).toEqual("array");
    });

    it('doit identifier les booléens', () => {
      expect(TypeManager.getType(true)).toEqual("boolean");
      expect(TypeManager.getType("true")).toEqual("boolean");
    });

    it('doit identifier les objets et strings', () => {
      expect(TypeManager.getType({})).toEqual("object");
      expect(TypeManager.getType("test")).toEqual("string");
    });
  });

  describe('getFormatedType', () => {
    it('doit transformer une string nombre en vrai nombre', () => {
      expect(TypeManager.getFormatedType("123")).toEqual(123);
      expect(typeof TypeManager.getFormatedType("123")).toEqual("number");
    });

    it('doit transformer une string booléenne en vrai booléen', () => {
      expect(TypeManager.getFormatedType("true")).toEqual(true);
      expect(TypeManager.getFormatedType("false")).toEqual(false);
    });

    it('doit retourner la valeur originale pour le reste', () => {
      const obj = { a: 1 };
      expect(TypeManager.getFormatedType(obj)).toEqual(obj);
      expect(TypeManager.getFormatedType("une chaine")).toEqual("une chaine");
    });
  });
});