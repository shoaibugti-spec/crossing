import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Iter "mo:core/Iter";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Types
  public type UserRole = {
    #buyer;
    #seller;
    #moderator;
    #admin;
  };

  public type VerificationLevel = {
    #basic;
    #documentVerified;
    #fullyVerified;
  };

  public type AdStatus = {
    #draft;
    #active;
    #expired;
    #suspended;
  };

  public type Message = {
    sender : Principal;
    text : Text;
    timestamp : Time.Time;
  };

  public type KYCStatus = {
    #pending;
    #approved;
    #rejected;
  };

  public type TransactionStatus = {
    #initiated;
    #escrowed;
    #completed;
    #disputed;
    #refunded;
  };

  public type DisputeStatus = {
    #open;
    #underReview;
    #resolvedBuyer;
    #resolvedSeller;
    #closed;
  };

  public type NotificationType = {
    #message;
    #kycUpdate;
    #transaction;
    #dispute;
    #systemNotification;
  };

  public type User = {
    principal : Principal;
    role : UserRole;
    verification : VerificationLevel;
    trustScore : Nat;
    country : Text;
    languages : [Text];
    bio : Text;
    balance : Nat;
  };

  public type UserProfile = {
    role : UserRole;
    verification : VerificationLevel;
    trustScore : Nat;
    country : Text;
    languages : [Text];
    bio : Text;
    balance : Nat;
  };

  public type Listing = {
    id : Text;
    seller : Principal;
    title : Text;
    category : Text;
    destinationCountry : Text;
    originCountry : Text;
    price : Nat;
    currency : Text;
    processingTime : Text;
    requirements : [Text];
    status : AdStatus;
    views : Nat;
    images : [Storage.ExternalBlob];
  };

  public type Conversation = {
    id : Text;
    buyer : Principal;
    seller : Principal;
    adId : Text;
    messages : [Message];
  };

  public type KYCSubmission = {
    user : Principal;
    documentType : Text;
    description : Text;
    status : KYCStatus;
    reviewerNotes : Text;
    documentBlob : ?Storage.ExternalBlob;
  };

  public type Transaction = {
    id : Text;
    buyer : Principal;
    seller : Principal;
    adId : Text;
    status : TransactionStatus;
    amount : Nat;
    currency : Text;
  };

  public type Dispute = {
    transactionId : Text;
    reason : Text;
    evidence : Text;
    status : DisputeStatus;
    resolutionNotes : Text;
  };

  public type Review = {
    rating : Nat;
    comment : Text;
    adId : Text;
    transactionId : Text;
  };

  public type Notification = {
    user : Principal;
    title : Text;
    message : Text;
    notifType : NotificationType;
    read : Bool;
  };

  module User {
    public func compare(a : User, b : User) : Order.Order {
      switch (Text.compare(a.bio, b.bio)) {
        case (#equal) { Text.compare(a.country, b.country) };
        case (order) { order };
      };
    };
  };

  module Listing {
    public func compare(a : Listing, b : Listing) : Order.Order {
      switch (Text.compare(a.category, b.category)) {
        case (#equal) { Text.compare(a.title, b.title) };
        case (order) { order };
      };
    };
  };

  // State
  let users = Map.empty<Principal, User>();
  let listings = Map.empty<Text, Listing>();
  let conversations = Map.empty<Text, Conversation>();
  let kycSubmissions = Map.empty<Principal, KYCSubmission>();
  let transactions = Map.empty<Text, Transaction>();
  let disputes = Map.empty<Text, Dispute>();
  let reviews = Map.empty<Text, Review>();
  let notifications = Map.empty<Principal, List.List<Notification>>();

  // Mixins
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Helper functions
  func userToProfile(user : User) : UserProfile {
    {
      role = user.role;
      verification = user.verification;
      trustScore = user.trustScore;
      country = user.country;
      languages = user.languages;
      bio = user.bio;
      balance = user.balance;
    };
  };

  func profileToUser(caller : Principal, profile : UserProfile) : User {
    {
      principal = caller;
      role = profile.role;
      verification = profile.verification;
      trustScore = profile.trustScore;
      country = profile.country;
      languages = profile.languages;
      bio = profile.bio;
      balance = profile.balance;
    };
  };

  // User Profile Management (Required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (users.get(caller)) {
      case (null) { null };
      case (?user) { ?userToProfile(user) };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (users.get(user)) {
      case (null) { null };
      case (?u) { ?userToProfile(u) };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let user = profileToUser(caller, profile);
    users.add(caller, user);
  };

  // Core Functionality
  public shared ({ caller }) func createUser(country : Text, bio : Text, role : UserRole) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create user profiles");
    };
    let user : User = {
      principal = caller;
      role;
      verification = #basic;
      trustScore = 0;
      country;
      languages = [];
      bio;
      balance = 0;
    };
    users.add(caller, user);
  };

  public shared ({ caller }) func createListing(title : Text, category : Text, price : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create listings");
    };
    let id = title;
    var listing : Listing = {
      id = title;
      seller = caller;
      title;
      category;
      destinationCountry = "";
      originCountry = "";
      price;
      currency = "USD";
      processingTime = "";
      requirements = [];
      status = #draft;
      views = 0;
      images = [];
    };
    listings.add(id, listing);
    id;
  };

  public shared ({ caller }) func updateListing(listingId : Text, title : Text, category : Text, price : Nat, status : AdStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update listings");
    };
    switch (listings.get(listingId)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) {
        if (listing.seller != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the seller or admin can update this listing");
        };
        let updated : Listing = {
          id = listing.id;
          seller = listing.seller;
          title;
          category;
          destinationCountry = listing.destinationCountry;
          originCountry = listing.originCountry;
          price;
          currency = listing.currency;
          processingTime = listing.processingTime;
          requirements = listing.requirements;
          status;
          views = listing.views;
          images = listing.images;
        };
        listings.add(listingId, updated);
      };
    };
  };

  public shared ({ caller }) func suspendListing(listingId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can suspend listings");
    };
    switch (listings.get(listingId)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) {
        let updated : Listing = {
          id = listing.id;
          seller = listing.seller;
          title = listing.title;
          category = listing.category;
          destinationCountry = listing.destinationCountry;
          originCountry = listing.originCountry;
          price = listing.price;
          currency = listing.currency;
          processingTime = listing.processingTime;
          requirements = listing.requirements;
          status = #suspended;
          views = listing.views;
          images = listing.images;
        };
        listings.add(listingId, updated);
      };
    };
  };

  public query ({ caller }) func getListing(listingId : Text) : async Listing {
    // Public read access - no auth check needed
    switch (listings.get(listingId)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) { listing };
    };
  };

  public query ({ caller }) func getAllListingsBySeller(sellerId : Principal) : async [Listing] {
    // Public read access - no auth check needed
    let filtered = listings.values().toArray().filter(func(listing) { listing.seller == sellerId });
    filtered.sort();
  };

  public shared ({ caller }) func incrementListingViews(listingId : Text) : async () {
    // Public action - no auth check needed
    switch (listings.get(listingId)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) {
        let updated : Listing = {
          id = listing.id;
          seller = listing.seller;
          title = listing.title;
          category = listing.category;
          destinationCountry = listing.destinationCountry;
          originCountry = listing.originCountry;
          price = listing.price;
          currency = listing.currency;
          processingTime = listing.processingTime;
          requirements = listing.requirements;
          status = listing.status;
          views = listing.views + 1;
          images = listing.images;
        };
        listings.add(listingId, updated);
      };
    };
  };

  public shared ({ caller }) func createConversation(conversationId : Text, sellerId : Principal, adId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create conversations");
    };
    let newConv = {
      id = conversationId;
      buyer = caller;
      seller = sellerId;
      adId;
      messages = [];
    };
    conversations.add(conversationId, newConv);
  };

  public shared ({ caller }) func addMessage(conversationId : Text, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation does not exist") };
      case (?conversation) {
        if (conversation.buyer != caller and conversation.seller != caller) {
          Runtime.trap("Unauthorized: Only participants can send messages in this conversation");
        };
        let newMsg : Message = {
          sender = caller;
          text;
          timestamp = Time.now();
        };
        let updatedMessages = conversation.messages.concat([newMsg]);
        let updated = {
          id = conversation.id;
          buyer = conversation.buyer;
          seller = conversation.seller;
          adId = conversation.adId;
          messages = updatedMessages;
        };
        conversations.add(conversationId, updated);
      };
    };
  };

  public query ({ caller }) func getMessages(conversationId : Text) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };
    switch (conversations.get(conversationId)) {
      case (null) { Runtime.trap("Conversation does not exist") };
      case (?conv) {
        if (conv.buyer != caller and conv.seller != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only participants or admins can view messages");
        };
        conv.messages;
      };
    };
  };

  public shared ({ caller }) func submitKYC(documentType : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit KYC");
    };
    let kyc : KYCSubmission = {
      user = caller;
      documentType;
      description;
      status = #pending;
      reviewerNotes = "";
      documentBlob = null;
    };
    kycSubmissions.add(caller, kyc);
  };

  public shared ({ caller }) func updateKYCStatus(user : Principal, status : KYCStatus, reviewerNotes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins/moderators can update KYC status");
    };
    switch (kycSubmissions.get(user)) {
      case (null) { Runtime.trap("KYC submission does not exist") };
      case (?kyc) {
        let updated : KYCSubmission = {
          user = kyc.user;
          documentType = kyc.documentType;
          description = kyc.description;
          status;
          reviewerNotes;
          documentBlob = kyc.documentBlob;
        };
        kycSubmissions.add(user, updated);
      };
    };
  };

  public query ({ caller }) func getPendingKYCSubmissions() : async [KYCSubmission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins/moderators can view pending KYC submissions");
    };
    let filtered = kycSubmissions.values().toArray().filter(func(kyc) { kyc.status == #pending });
    filtered;
  };

  public shared ({ caller }) func recordTransaction(sellerId : Principal, adId : Text, amount : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record transactions");
    };
    let transactionId = adId;
    let tx : Transaction = {
      id = transactionId;
      buyer = caller;
      seller = sellerId;
      adId;
      status = #initiated;
      amount;
      currency = "USD";
    };
    transactions.add(transactionId, tx);
    transactionId;
  };

  public shared ({ caller }) func updateTransactionStatus(transactionId : Text, status : TransactionStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update transactions");
    };
    switch (transactions.get(transactionId)) {
      case (null) { Runtime.trap("Transaction does not exist") };
      case (?tx) {
        if (tx.buyer != caller and tx.seller != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only transaction participants or admins can update status");
        };
        let updated : Transaction = {
          id = tx.id;
          buyer = tx.buyer;
          seller = tx.seller;
          adId = tx.adId;
          status;
          amount = tx.amount;
          currency = tx.currency;
        };
        transactions.add(transactionId, updated);
      };
    };
  };

  public shared ({ caller }) func createDispute(transactionId : Text, reason : Text, evidence : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create disputes");
    };
    switch (transactions.get(transactionId)) {
      case (null) { Runtime.trap("Transaction does not exist") };
      case (?tx) {
        if (tx.buyer != caller and tx.seller != caller) {
          Runtime.trap("Unauthorized: Only transaction participants can create disputes");
        };
        let dispute : Dispute = {
          transactionId;
          reason;
          evidence;
          status = #open;
          resolutionNotes = "";
        };
        disputes.add(transactionId, dispute);
      };
    };
  };

  public shared ({ caller }) func updateDisputeStatus(transactionId : Text, status : DisputeStatus, resolutionNotes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update dispute status");
    };
    switch (disputes.get(transactionId)) {
      case (null) { Runtime.trap("Dispute does not exist") };
      case (?dispute) {
        let updated : Dispute = {
          transactionId = dispute.transactionId;
          reason = dispute.reason;
          evidence = dispute.evidence;
          status;
          resolutionNotes;
        };
        disputes.add(transactionId, updated);
      };
    };
  };

  public shared ({ caller }) func createReview(transactionId : Text, adId : Text, rating : Nat, comment : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create reviews");
    };
    switch (transactions.get(transactionId)) {
      case (null) { Runtime.trap("Transaction does not exist") };
      case (?tx) {
        if (tx.buyer != caller and tx.seller != caller) {
          Runtime.trap("Unauthorized: Only transaction participants can create reviews");
        };
        let review : Review = {
          rating;
          comment;
          adId;
          transactionId;
        };
        reviews.add(transactionId, review);
      };
    };
  };

  public query ({ caller }) func getUserNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };
    let notificationsList = switch (notifications.get(caller)) {
      case (null) { List.empty<Notification>() };
      case (?n) { n };
    };
    notificationsList.toArray();
  };

  public shared ({ caller }) func markNotificationAsRead(index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    // Implementation would update the notification at the given index
  };

  // Admin/Moderator queries
  public query ({ caller }) func getAllUsers() : async [User] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    users.values().toArray().sort();
  };

  public query ({ caller }) func getAllListings() : async [Listing] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all listings");
    };
    listings.values().toArray().sort();
  };

  public query ({ caller }) func getAllSuspendedListings() : async [Listing] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view suspended listings");
    };
    let filtered = listings.values().toArray().filter(func(listing) { listing.status == #suspended });
    filtered.sort();
  };

  public query ({ caller }) func getAllOpenDisputes() : async [Dispute] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all disputes");
    };
    let filtered = disputes.values().toArray().filter(func(dispute) { dispute.status == #open });
    filtered;
  };
};
